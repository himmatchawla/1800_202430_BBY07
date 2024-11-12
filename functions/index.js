const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.calculateAverageSafetyLevel = functions.pubsub.schedule("every 1 hours").onRun(async () => {
  const stationsSnapshot = await db.collection("stations").get();

  await Promise.all(stationsSnapshot.docs.map(async (stationDoc) => {
    const stationId = stationDoc.id;
    const reportsRef = db.collection("stations").doc(stationId).collection("safetyReports");
    const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

    const snapshot = await reportsRef.where("timestamp", ">", oneHourAgo).get();
    const safetyLevels = snapshot.docs.map((doc) => doc.data().safetyLevel);

    const average = safetyLevels.reduce((sum, level) => sum + level, 0) / safetyLevels.length || "N/A";

    await db.collection("stations").doc(stationId).update({ currentSafetyLevel: average });
  }));

  console.log("Average safety levels updated for all stations");
});


// Cloud function to create a Firestore document for each new user
exports.createUserDocument = functions.auth.user().onCreate((user) => {
  const userRef = db.collection("users").doc(user.uid);

  // Set the document with default values for new users
  return userRef.set({
    auraPoints: 0,
    history: []
  }).then(() => {
    console.log(`User document created for UID: ${user.uid}`);
  }).catch((error) => {
    console.error("Error creating user document:", error);
  });
});
