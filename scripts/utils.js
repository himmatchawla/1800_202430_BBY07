//UTILS.JS CONTAINS FUNCTIONS THAT ARE USED SLIGHTLY DIFFERENTLY ACROSS MULTIPLE SCRIPTS

// calculate average safety level of station or route from data in the last hour
async function calculateAverageSafetyLevel(collection, documentId) {
    console.log(`Calculating average for ${collection}/${documentId}`);
    try {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        console.log(`Query returned ${snapshot.size} documents for ${collection}/${documentId}`);

        const reports = snapshot.docs.map(doc => {
            console.log("Document data:", doc.data());
            return doc.data().safetyLevel;
        });

        const average = reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";

        console.log(`Calculated average for ${collection}/${documentId}:`, average);
        return average;
    } catch (error) {
        console.error(`Error calculating safety level for ${collection}/${documentId}:`, error);
        return "N/A";
    }
}

// Get last incident report time
async function getLastIncidentReportTime(collection, itemId) {
    try {
        const incidentReportsRef = db.collection(collection).doc(itemId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(1).get();

        if (!snapshot.empty) {
            const lastIncident = snapshot.docs[0].data().timestamp?.toDate();
            return lastIncident ? new Date(lastIncident).toLocaleString() : "No recent incidents";
        } else {
            return "No recent incidents";
        }
    } catch (error) {
        console.error("Error fetching last incident report:", error);
        return "No recent incidents";
    }
}

// Check bookmark status
async function checkBookmarkStatus(itemId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.warn("User not logged in.");
        return false;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);
    const doc = await bookmarkRef.get();
    return doc.exists;
}
