import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase-config";
import { ref, onValue } from "firebase/database";

export const useFirebaseRealtime = (path, limit = 50) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let loadingTimeout;

    try {
      const dataRef = ref(realtimeDb, path);

      loadingTimeout = setTimeout(() => {
        setError(new Error("Firebase connection timeout"));
        setLoading(false);
      }, 5000);

      const unsubscribe = onValue(
        dataRef,
        (snapshot) => {
          clearTimeout(loadingTimeout);

          console.log("🔥 Firebase data received:", snapshot.exists());

          if (snapshot.exists()) {
            const firebaseData = snapshot.val();
            console.log(
              "📊 Total entries in Firebase:",
              Object.keys(firebaseData).length
            );

            const dataArray = Object.keys(firebaseData).map((key) => ({
              id: key,
              ...firebaseData[key],
            }));

            console.log(
              "📋 First 3 entries:",
              dataArray.slice(0, 3).map((d) => ({
                id: d.id,
                name: d.emp_name,
                timestamp: d.timestamp,
              }))
            );

            // Safe sorting (newest first)
            dataArray.sort((a, b) => {
              let timeA = 0;
              let timeB = 0;

              // Handle timeA
              if (typeof a.timestamp === "number") {
                timeA = a.timestamp;
              } else if (typeof a.timestamp === "string") {
                timeA = new Date(a.timestamp).getTime();
                if (isNaN(timeA)) timeA = 0;
              } else if (a.entry_time) {
                timeA = new Date(a.entry_time).getTime();
                if (isNaN(timeA)) timeA = 0;
              }

              // Handle timeB
              if (typeof b.timestamp === "number") {
                timeB = b.timestamp;
              } else if (typeof b.timestamp === "string") {
                timeB = new Date(b.timestamp).getTime();
                if (isNaN(timeB)) timeB = 0;
              } else if (b.entry_time) {
                timeB = new Date(b.entry_time).getTime();
                if (isNaN(timeB)) timeB = 0;
              }

              return timeB - timeA; // Newest first
            });

            const limitedData = dataArray.slice(0, limit);
            console.log("✅ Setting data with", limitedData.length, "entries");
            setData(limitedData);
          } else {
            console.log("⚠️ No data in Firebase");
            setData([]);
          }

          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("❌ Firebase error:", err);
          clearTimeout(loadingTimeout);
          setError(err);
          setLoading(false);
        }
      );

      // ✅ Proper v9 cleanup
      return () => {
        clearTimeout(loadingTimeout);
        unsubscribe();
      };
    } catch (err) {
      clearTimeout(loadingTimeout);
      setError(err);
      setLoading(false);
    }
  }, [path, limit]);

  return { data, loading, error };
};
