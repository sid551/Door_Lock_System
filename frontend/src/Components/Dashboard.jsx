import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { useFirebaseRealtime } from "../hooks/useFirebaseRealtime";
import TestPanel from "./TestPanel";
import AnalyticsCards from "./AnalyticsCards";
import AccessChart from "./AccessChart";
import EmployeeAnalytics from "./EmployeeAnalytics";
import ExportButtons from "./ExportButtons";
import NotificationSettings from "./NotificationSettings";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  // ---------------- FILTER STATE ----------------
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState([]);

  // ---------------- APPLY FILTERS ----------------
  const applyFilters = () => {
    let filtered = logs;

    if (employeeFilter) {
      filtered = filtered.filter((log) => log.emp_name === employeeFilter);
    }

    // ❌ OLD (could crash if entry_time invalid)
    /*
    if (dateFilter) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.entry_time)
          .toISOString()
          .split("T")[0];
        return logDate === dateFilter;
      });
    }
    */

    // ✅ NEW (uses numeric timestamp safely)
    if (dateFilter) {
      filtered = filtered.filter((log) => {
        if (!log.timestamp) return false;

        try {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          return logDate === dateFilter;
        } catch (error) {
          console.warn("Invalid timestamp for log:", log);
          return false;
        }
      });
    }

    setFilteredLogs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [logs, dateFilter, employeeFilter]);

  const clearFilters = () => {
    setDateFilter("");
    setEmployeeFilter("");
  };

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setFilteredLogs([]);
      setEmployees([]);
      return;
    }

    const uniqueEmployees = [...new Set(logs.map((log) => log.emp_name))];
    setEmployees(uniqueEmployees.sort());
  }, [logs]);

  // ---------------- FIREBASE REALTIME ----------------
  const {
    data: firebaseLogs,
    loading: firebaseLoading,
    error: firebaseError,
  } = useFirebaseRealtime("rfid_logs", 50);

  useEffect(() => {
    setLogs(firebaseLogs);
    setLoading(firebaseLoading);
  }, [firebaseLogs, firebaseLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ---------------- SAFE DATE FORMATTER ----------------
  // ❌ OLD (could throw "Invalid time value")
  /*
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {...}).format(date);
  };
  */

  // ✅ NEW (safe + supports ISO + timestamp)
  const formatDateTime = (value) => {
    if (!value) return "Invalid Date";

    const date = typeof value === "number" ? new Date(value) : new Date(value);

    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  // ---------------- SAFE STATUS BADGE ----------------
  // ❌ OLD (unsafe if undefined)
  /*
  const isSuccess = status.toLowerCase() === "success";
  */

  const getStatusBadge = (log) => {
    // Check both attempt and status fields
    // If attempt is a number, use status instead
    const attemptValue = log.attempt || "";
    const statusValue = log.status || "";
    const isAttemptNumber =
      typeof attemptValue === "number" || !isNaN(Number(attemptValue));

    const statusToCheck = isAttemptNumber
      ? statusValue
      : attemptValue || statusValue;
    const statusText = String(statusToCheck).toLowerCase();
    const isSuccess = statusText === "success" || statusText === "granted";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isSuccess
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-100 text-red-700 border border-red-200"
        }`}
      >
        {isSuccess ? "✓" : "✕"} {isSuccess ? "Success" : "Failed"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading dashboard...
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Firebase Error: {firebaseError.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="p-4 flex justify-between items-center bg-slate-800">
        <h1 className="text-xl font-bold">Door Lock System Dashboard</h1>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-600 rounded"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button onClick={logout} className="px-4 py-2 bg-red-600 rounded">
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        {/* ---------------- ANALYTICS CARDS ---------------- */}
        <AnalyticsCards logs={logs} />

        {/* ---------------- ACCESS CHART ---------------- */}
        <AccessChart logs={logs} />

        {/* ---------------- EMPLOYEE ANALYTICS ---------------- */}
        <EmployeeAnalytics logs={logs} />

        {/* ---------------- NOTIFICATION SETTINGS ---------------- */}
        <NotificationSettings />

        {/* ---------------- EXPORT BUTTONS ---------------- */}
        <ExportButtons logs={logs} filteredLogs={filteredLogs} />

        {/* ---------------- FILTERS ---------------- */}
        <div className="flex gap-4 mb-4">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 text-black rounded bg-white"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp} value={emp}>
                {emp}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-black rounded bg-white"
          />

          {(dateFilter || employeeFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-red-400 rounded text-black"
            >
              Clear
            </button>
          )}
        </div>

        {/* ---------------- TABLE ---------------- */}
        <div className="bg-white text-black rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Entry Time</th>
                <th className="p-3 text-left">Attempt</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="border-b">
                    <td className="p-3">#{log.id || "N/A"}</td>
                    <td className="p-3">{log.emp_name}</td>
                    <td className="p-3">
                      {formatDateTime(log.timestamp || log.entry_time)}
                    </td>
                    <td className="p-3">{getStatusBadge(log)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
