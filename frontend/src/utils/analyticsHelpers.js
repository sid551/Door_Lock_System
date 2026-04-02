// Analytics Helper Functions

export const calculateStats = (logs) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter logs with valid timestamps
  const validLogs = logs.filter((log) => {
    if (!log.timestamp) return false;
    const date = new Date(log.timestamp);
    return !isNaN(date.getTime());
  });

  const todayLogs = validLogs.filter((log) => new Date(log.timestamp) >= today);
  const weekLogs = validLogs.filter(
    (log) => new Date(log.timestamp) >= weekAgo
  );
  const monthLogs = validLogs.filter(
    (log) => new Date(log.timestamp) >= monthAgo
  );

  // Helper function to check if status is success
  const isSuccess = (log) => {
    const attemptValue = log.attempt || "";
    const statusValue = log.status || "";

    // Check if attempt is a number (counter)
    const isAttemptNumber =
      typeof attemptValue === "number" || !isNaN(Number(attemptValue));

    // Use status if attempt is a number
    const statusToCheck = isAttemptNumber
      ? statusValue
      : attemptValue || statusValue;
    const status = String(statusToCheck).toLowerCase();
    return status === "success" || status === "granted";
  };

  return {
    today: todayLogs.length,
    week: weekLogs.length,
    month: monthLogs.length,
    todaySuccess: todayLogs.filter(isSuccess).length,
    todayFailed: todayLogs.filter((l) => !isSuccess(l)).length,
  };
};

export const getEmployeeStats = (logs) => {
  const employeeMap = {};

  logs.forEach((log) => {
    // Debug: log the first record to see structure
    if (Object.keys(employeeMap).length === 0) {
      console.log("Sample log data:", log);
      console.log("Fields:", Object.keys(log));
    }

    if (!employeeMap[log.emp_name]) {
      employeeMap[log.emp_name] = {
        name: log.emp_name,
        totalAccess: 0,
        successCount: 0,
        failedCount: 0,
        firstAccess: log.timestamp,
        lastAccess: log.timestamp,
        accessHistory: [],
      };
    }

    const emp = employeeMap[log.emp_name];
    emp.totalAccess++;

    // Handle different status formats
    // If attempt is a number (counter), use status field instead
    const attemptValue = log.attempt || "";
    const statusValue = log.status || "";

    // Check if attempt is a number (like 1, 2, 3...)
    const isAttemptNumber =
      typeof attemptValue === "number" || !isNaN(Number(attemptValue));

    // Use status if attempt is a number, otherwise use attempt
    const statusToCheck = isAttemptNumber
      ? statusValue
      : attemptValue || statusValue;
    const status = String(statusToCheck).toLowerCase();
    const isSuccess = status === "success" || status === "granted";

    if (isSuccess) emp.successCount++;
    else emp.failedCount++;

    if (log.timestamp < emp.firstAccess) emp.firstAccess = log.timestamp;
    if (log.timestamp > emp.lastAccess) emp.lastAccess = log.timestamp;

    emp.accessHistory.push(log);
  });

  return Object.values(employeeMap);
};

export const getChartData = (logs, days = 7) => {
  const now = new Date();
  const data = [];

  // Filter logs with valid timestamps
  const validLogs = logs.filter((log) => {
    if (!log.timestamp) return false;
    const date = new Date(log.timestamp);
    return !isNaN(date.getTime());
  });

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayLogs = validLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= dayStart && logDate < dayEnd;
    });

    // Count success/failed with flexible status checking
    const successCount = dayLogs.filter((l) => {
      const attemptValue = l.attempt || "";
      const statusValue = l.status || "";
      const isAttemptNumber =
        typeof attemptValue === "number" || !isNaN(Number(attemptValue));
      const statusToCheck = isAttemptNumber
        ? statusValue
        : attemptValue || statusValue;
      const status = String(statusToCheck).toLowerCase();
      return status === "success" || status === "granted";
    }).length;

    const failedCount = dayLogs.filter((l) => {
      const attemptValue = l.attempt || "";
      const statusValue = l.status || "";
      const isAttemptNumber =
        typeof attemptValue === "number" || !isNaN(Number(attemptValue));
      const statusToCheck = isAttemptNumber
        ? statusValue
        : attemptValue || statusValue;
      const status = String(statusToCheck).toLowerCase();
      return status === "failed" || status === "denied";
    }).length;

    data.push({
      date: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      success: successCount,
      failed: failedCount,
      total: dayLogs.length,
    });
  }

  return data;
};

export const exportToCSV = (logs) => {
  const headers = [
    "ID",
    "Employee Name",
    "Card ID",
    "Entry Time",
    "Status",
    "Timestamp",
  ];
  const rows = logs.map((log) => {
    const attemptValue = log.attempt || "";
    const statusValue = log.status || "";
    const isAttemptNumber =
      typeof attemptValue === "number" || !isNaN(Number(attemptValue));
    const statusToCheck = isAttemptNumber
      ? statusValue
      : attemptValue || statusValue;
    const status = String(statusToCheck).toLowerCase();
    const statusText =
      status === "success" || status === "granted" ? "Success" : "Failed";

    return [
      log.id || "N/A",
      log.emp_name,
      log.card_id || "N/A",
      new Date(log.timestamp).toLocaleString(),
      statusText,
      log.timestamp,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `access-logs-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getDoorStatus = (logs) => {
  if (logs.length === 0) return { status: "unknown", lastActivity: null };

  const latestLog = logs[0];
  const timeSinceLastAccess = Date.now() - latestLog.timestamp;
  const fiveMinutes = 5 * 60 * 1000;

  return {
    status: timeSinceLastAccess < fiveMinutes ? "active" : "locked",
    lastActivity: latestLog.timestamp,
    lastUser: latestLog.emp_name,
  };
};
