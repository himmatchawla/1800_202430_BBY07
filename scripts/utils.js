//UTILS.JS CONTAINS FUNCTIONS THAT ARE MODULARIZED TO BE USED ACROSS MULTIPLE SCRIPTS TO AVOID DOUBLE SIMILAR DEFINITIONS

// calculate average safety level of station or route from data in the last hour
async function calculateAverageSafetyLevel(collection, documentId) {
    console.log(`Calculating average for ${collection}/${documentId}`); // error logging
    try { // try block for error handling
        const oneHourAgo = new Date(Date.now() - 3600000); // get timestamp from an hour ago
        const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        console.log(`Query returned ${snapshot.size} documents for ${collection}/${documentId}`);

        const reports = snapshot.docs.map(doc => {
            console.log("Document data:", doc.data());
            return doc.data().safetyLevel;
        });

        const average = reports.length // calculate average safety level
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";

        console.log(`Calculated average for ${collection}/${documentId}:`, average);
        return average;
    } catch (error) { // error handling
        console.error(`Error calculating safety level for ${collection}/${documentId}:`, error);
        return "N/A";
    }
}

// get last incident report time
async function getLastIncidentReportTime(collection, itemId) {
    try { // try block for error handling
        const incidentReportsRef = db.collection(collection).doc(itemId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(1).get();

        if (!snapshot.empty) { // if there are incident reports, return the timestamp of the most recent one
            const lastIncident = snapshot.docs[0].data().timestamp?.toDate();
            return lastIncident ? new Date(lastIncident).toLocaleString() : "No recent incidents";
        } else {
            return "No recent incidents";
        }
    } catch (error) { // error handling
        console.error("Error fetching last incident report:", error);
        return "No recent incidents";
    }
}

// check bookmark status
async function checkBookmarkStatus(itemId) {
    const user = firebase.auth().currentUser;
    if (!user) { // user cannot view bookmarks if not logged in
        console.warn("User not logged in.");
        return false;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);
    const doc = await bookmarkRef.get(); // check if the item is bookmarked
    return doc.exists; // return true if bookmark exists
}
