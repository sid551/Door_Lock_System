import { useState } from "react";
import { getEmployeeStats } from "../utils/analyticsHelpers";

export default function EmployeeAnalytics({ logs }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const employeeStats = getEmployeeStats(logs);

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Employee Analytics
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Employee Summary
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employeeStats.map((emp, index) => (
              <div
                key={index}
                onClick={() => setSelectedEmployee(emp)}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedEmployee?.name === emp.name
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-600">
                      Total Access: {emp.totalAccess}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-green-600">✓ {emp.successCount}</p>
                    <p className="text-red-600">✕ {emp.failedCount}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>First: {formatDateTime(emp.firstAccess)}</p>
                  <p>Last: {formatDateTime(emp.lastAccess)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Employee Timeline */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            {selectedEmployee
              ? `${selectedEmployee.name}'s Access History`
              : "Select an Employee"}
          </h3>

          {selectedEmployee ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedEmployee.accessHistory
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log, index) => {
                  // Check both attempt and status fields
                  // If attempt is a number, use status instead
                  const attemptValue = log.attempt || "";
                  const statusValue = log.status || "";
                  const isAttemptNumber =
                    typeof attemptValue === "number" ||
                    !isNaN(Number(attemptValue));

                  const statusToCheck = isAttemptNumber
                    ? statusValue
                    : attemptValue || statusValue;
                  const status = String(statusToCheck).toLowerCase();
                  const isSuccess =
                    status === "success" || status === "granted";

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        isSuccess
                          ? "bg-green-50 border-green-500"
                          : "bg-red-50 border-red-500"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {isSuccess ? "✓ Access Granted" : "✕ Access Denied"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDateTime(log.timestamp)}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.card_id || "N/A"}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Click on an employee to view their access history
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
