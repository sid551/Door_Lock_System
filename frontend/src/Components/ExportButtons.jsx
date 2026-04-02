import { exportToCSV } from "../utils/analyticsHelpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportButtons({ logs, filteredLogs }) {
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Access Logs Report", 14, 20);

    // Date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Records: ${filteredLogs.length}`, 14, 37);

    // Statistics
    const getStatus = (log) => {
      const attemptValue = log.attempt || "";
      const statusValue = log.status || "";
      const isAttemptNumber =
        typeof attemptValue === "number" || !isNaN(Number(attemptValue));
      const statusToCheck = isAttemptNumber
        ? statusValue
        : attemptValue || statusValue;
      const status = String(statusToCheck).toLowerCase();
      return status === "success" || status === "granted";
    };

    const successCount = filteredLogs.filter(getStatus).length;
    const failedCount = filteredLogs.length - successCount;

    doc.setFontSize(12);
    doc.text("Summary:", 14, 47);
    doc.setFontSize(10);
    doc.text(
      `Success: ${successCount} (${
        filteredLogs.length > 0
          ? ((successCount / filteredLogs.length) * 100).toFixed(1)
          : 0
      }%)`,
      14,
      54
    );
    doc.text(
      `Failed: ${failedCount} (${
        filteredLogs.length > 0
          ? ((failedCount / filteredLogs.length) * 100).toFixed(1)
          : 0
      }%)`,
      14,
      60
    );

    // Table
    const tableData = filteredLogs.map((log) => {
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
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
        statusText,
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [["ID", "Employee", "Card ID", "Time", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [51, 51, 51] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
        4: { cellWidth: 25 },
      },
    });

    doc.save(`access-logs-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={() => exportToCSV(filteredLogs)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
      >
        <span>📊</span> Export CSV
      </button>

      <button
        onClick={exportToPDF}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
      >
        <span>📄</span> Export PDF
      </button>
    </div>
  );
}
