const nodemailer = require("nodemailer");

// Check if email is configured
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// Email configuration
const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: "gmail", // or 'smtp.gmail.com'
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // App password (not regular password)
      },
    })
  : null;

// Send security alert email
async function sendSecurityAlert(logData) {
  if (!isEmailConfigured || !transporter) {
    console.log("Email not configured, skipping notification");
    return false;
  }

  const { emp_name, card_id, attempt, entry_time } = logData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL, // Admin email to receive alerts
    subject: `🚨 Security Alert: ${
      attempt === "failed" ? "Failed Access Attempt" : "Access Granted"
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${attempt === "failed" ? "#ef4444" : "#10b981"};">
          ${
            attempt === "failed"
              ? "⚠️ Failed Access Attempt"
              : "✅ Access Granted"
          }
        </h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>Employee:</strong> ${emp_name}</p>
          <p><strong>Card ID:</strong> ${card_id || "N/A"}</p>
          <p><strong>Status:</strong> ${attempt}</p>
          <p><strong>Time:</strong> ${new Date(entry_time).toLocaleString()}</p>
        </div>
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          This is an automated alert from your IoT Security Lock System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Security alert email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return false;
  }
}

// Send daily summary report
async function sendDailySummary(stats) {
  if (!isEmailConfigured || !transporter) {
    console.log("Email not configured, skipping daily summary");
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: `📊 Daily Access Report - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Daily Access Summary</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h3>Statistics for ${new Date().toLocaleDateString()}</h3>
          <p><strong>Total Attempts:</strong> ${stats.total}</p>
          <p><strong>Successful:</strong> ${stats.success}</p>
          <p><strong>Failed:</strong> ${stats.failed}</p>
          <p><strong>Unique Users:</strong> ${stats.uniqueUsers}</p>
        </div>
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          This is an automated daily report from your IoT Security Lock System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Daily summary email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending daily summary:", error.message);
    return false;
  }
}

module.exports = {
  sendSecurityAlert,
  sendDailySummary,
};
