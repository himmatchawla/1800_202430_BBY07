// Import the Firebase Admin SDK and Node.js file system module
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK with service account credentials
admin.initializeApp({
  credential: admin.credential.cert(require("./firebase/serviceAccountKey.json"))
});

// Get a Firestore instance
const db = admin.firestore();

// Function to read JSON file and batch write to Firestore
function readJsonAndSaveToFirestore() {
  // Read the JSON file
  fs.readFile("./rapid-transit-stations.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return;
    }

    // Parse the JSON data
    const stations = JSON.parse(data);
    const batch = db.batch(); // Create a Firestore batch

    stations.forEach((item, index) => {
      // Create a reference to each station document using `station` as the ID
      const docRef = db.collection("stations").doc(item.station);

      // Set the document fields based on the JSON data
      batch.set(docRef, {
        name: item.name,
        currentSafetyLevel: item.currentSafetyLevel,
        safetyReports: item.safetyReports,
        incidentReports: item.incidentReports
      });

      // Commit the batch every 500 writes
      if ((index + 1) % 500 === 0) {
        batch.commit().then(() => console.log("Batch committed at index:", index));
      }
    });

    // Commit any remaining documents in the batch
    batch.commit()
      .then(() => {
        console.log("Successfully saved data to Firestore!");
      })
      .catch(error => {
        console.error("Error writing data to Firestore:", error);
      });
  });
}

// Execute the function to read and save JSON data to Firestore
readJsonAndSaveToFirestore();
