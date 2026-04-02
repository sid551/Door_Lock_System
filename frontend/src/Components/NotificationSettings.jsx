import { useState } from "react";
import axios from "axios";

export default function NotificationSettings() {
  const [email, setEmail] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      // Add a failed test log to trigger notification
      await axios.post("http://localhost:5000/api/logs", {
        emp_name: "Test User",
        card_id: "TEST001",
        attempt: "failed",
      });

      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error("Test notification failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        📧 Email Notifications
      </h2>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Email notifications are configured in the backend .env file. Failed
            access attempts will trigger automatic security alerts.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={sendTestNotification}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Test Alert"}
          </button>

          {testSent && (
            <span className="text-green-600 text-sm">
              ✓ Test alert triggered! Check your email.
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Failed attempts trigger automatic emails</p>
          <p>• Configure EMAIL_USER and EMAIL_PASSWORD in backend/.env</p>
          <p>• Set ALERT_EMAIL to receive notifications</p>
        </div>
      </div>
    </div>
  );
}
