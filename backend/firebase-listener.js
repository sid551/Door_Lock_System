// Firebase Realtime Database Listener for Email Notifications
// This monitors Firebase for new entries and sends email alerts

const { sendSecurityAlert } = require("./emailService");

let realtimeDb;
let lastProcessedKey = null;

try {
  const firebaseConfig = require("./firebase-config");
  realtimeDb = firebaseConfig.realtimeDb;
  console.log("✓ Firebase listener initialized");
} catch (error) {
  console.error("Firebase not configured:", error.message);
}

function startFirebaseListener() {
  if (!realtimeDb) {
    console.log("Firebase not available, listener not started");
    return;
  }

  console.log("🔍 Initializing Firebase listener...");
  const logsRef = realtimeDb.ref("rfid_logs");

  // First, get the latest key to avoid processing old data
  logsRef
    .orderByKey()
    .limitToLast(1)
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          lastProcessedKey = child.key;
          console.log(
            `✓ Firebase listener initialized. Last key: ${lastProcessedKey}`
          );
        });
      } else {
        console.log("✓ Firebase listener initialized. No existing data.");
      }

      // Now start listening for new additions
      console.log("👂 Starting to listen for new entries...");

      logsRef.on("child_added", (snapshot) => {
        const key = snapshot.key;
        const logData = snapshot.val();

        console.log(`\n📥 Firebase event received: ${key}`);
        console.log(`   Data:`, JSON.stringify(logData, null, 2));
        console.log(`   Last processed: ${lastProcessedKey}`);
        console.log(
          `   Key comparison: ${key} > ${lastProcessedKey} = ${
            key > lastProcessedKey
          }`
        );

        // Skip if this is old data (already processed)
        if (lastProcessedKey && key <= lastProcessedKey) {
          console.log(`   ⏭️  Skipping old entry`);
          return;
        }

        // Process new entry
        console.log(`🔔 NEW LOG DETECTED: ${key} - ${logData.emp_name}`);

        // Check if it's a failed/denied attempt
        const attemptValue = logData.attempt || "";
        const statusValue = logData.status || "";

        console.log(
          `   attempt field: "${attemptValue}" (type: ${typeof attemptValue})`
        );
        console.log(
          `   status field: "${statusValue}" (type: ${typeof statusValue})`
        );

        // Check if attempt is a number (counter)
        const isAttemptNumber =
          typeof attemptValue === "number" || !isNaN(Number(attemptValue));

        // Use status if attempt is numeric
        const statusToCheck = isAttemptNumber
          ? statusValue
          : attemptValue || statusValue;
        const status = String(statusToCheck).toLowerCase();
        const isFailed = status === "failed" || status === "denied";

        console.log(`   isAttemptNumber: ${isAttemptNumber}`);
        console.log(`   statusToCheck: "${statusToCheck}"`);
        console.log(`   Final status: "${status}"`);
        console.log(`   Is failed: ${isFailed}`);
        console.log(`   EMAIL_ALL_ATTEMPTS: ${process.env.EMAIL_ALL_ATTEMPTS}`);

        // Send email for failed attempts
        if (isFailed || process.env.EMAIL_ALL_ATTEMPTS === "true") {
          console.log(`📧 SENDING EMAIL for ${logData.emp_name} (${status})`);

          sendSecurityAlert({
            emp_name: logData.emp_name,
            card_id: logData.card_id,
            attempt: isFailed ? "failed" : "success",
            entry_time: logData.entry_time || new Date().toISOString(),
          })
            .then(() => {
              console.log("✅ Email sent successfully!");
            })
            .catch((err) => {
              console.log("❌ Email failed:", err.message);
            });
        } else {
          console.log(
            `   ℹ️  Skipping email (success attempt, EMAIL_ALL_ATTEMPTS=false)`
          );
        }

        lastProcessedKey = key;
      });

      console.log(
        "✅ Firebase listener active - monitoring for new access attempts\n"
      );
    })
    .catch((error) => {
      console.error("❌ Error initializing Firebase listener:", error);
    });
}

module.exports = { startFirebaseListener };
