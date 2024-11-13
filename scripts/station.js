// script run tester
console.log("Hello from station JS");

// new firebase instance if one doesnt already exist
if (!firebase.apps.length) {
    console.log("Initializing Firebase app...");
    firebase.initializeApp(firebaseConfig);
} else {
    console.log("Firebase already initialized.");
}

// get stationId from URL (after onclick creates link in populateDropdown())
function getStationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("stationId");
}

// load the station data based on the stationId
async function loadStationData() {
    const stationId = getStationIdFromURL();
    if (!stationId) {
        console.error("No station ID specified in URL.");
        return;
    }

    try {
        const stationDoc = await db.collection("stations").doc(stationId).get();
        if (stationDoc.exists) {
            const stationData = stationDoc.data();
            document.getElementById("stationName").textContent = stationData.name || "Unknown";
            document.getElementById("stationNeighborhood").textContent = `Neighborhood: ${stationData.neighborhood || "N/A"}`;
            document.getElementById("stationDescription").textContent = `Description: ${stationData.description || "N/A"}`;
            document.getElementById("stationFacilities").textContent = `Facilities: ${stationData.facilities || "N/A"}`;

            calculateAverageSafetyLevel(stationId); // calculate average safety level (function defined below)
        } else {
            console.error("Station data not found.");
        }
    } catch (error) {
        console.error("Error loading station data:", error);
    }
}

// report safety level
async function reportSafetyLevel(stationId, safetyLevel) {
    console.log("Reporting Safety Level:", safetyLevel); // error logging - check if the function is called
    try {
        const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");
        
        console.log("Writing to Firestore"); // error logging - check if firestore write is attempted
        await safetyReportsRef.add({
            userId: "test-user", // eventually add functionality to use specific users
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // success message
        document.getElementById("reportMessage").textContent = "Safety level reported successfully.";
        calculateAverageSafetyLevel(stationId); // refresh the average safety level
    } catch (error) {
        console.error('Error reporting safety level:', error);
        document.getElementById("reportMessage").textContent = "Failed to report safety level.";
    }
}


// calculate and display the average safety level from reports within the last hour
async function calculateAverageSafetyLevel(stationId) {
    const oneHourAgo = new Date(Date.now() - 3600000); // calculation for one hour ago
    const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");

    try {
        const recentReportsSnapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();
        const recentReports = recentReportsSnapshot.docs.map(doc => doc.data().safetyLevel);

        const averageSafetyLevel = recentReports.length
            ? (recentReports.reduce((sum, level) => sum + level, 0) / recentReports.length).toFixed(2)
            : "N/A";
        
        document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;
    } catch (error) {
        console.error("Error calculating average safety level:", error);
    }
}

// load station data and attach event listener to the button on page load
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded triggered");
    loadStationData();

    const stationId = getStationIdFromURL();
    console.log("Station ID from URL:", stationId);

    const reportButton = document.getElementById("reportSafetyButton");
    if (reportButton) {
        reportButton.addEventListener("click", () => {
            console.log("Report Safety Button Clicked");
            const safetyLevel = document.getElementById("safetyLevelInput").value; // get the selected safety level
            if (safetyLevel) {
                reportSafetyLevel(stationId, parseInt(safetyLevel));
            } else {
                alert("Please select a safety level before submitting.");
            }
        });
    } else {
        console.error("Report Safety Button not found");
    }
});
