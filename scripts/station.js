// script run tester
console.log("Hello from station JS");

// Ensure Firebase and Firestore (`db`) are available from the config file
if (!firebase.apps.length) {
    console.error("Firebase is not initialized. Check if firebaseConfig.js is loaded before station.js.");
}

// Get stationId from URL (used in station.html)
function getStationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("stationId");
}

// Add station to recently viewed list and ensure only the latest 5 are saved
async function addToRecentlyViewed(stationId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return;
    }

    const userId = user.uid;
    const userRef = db.collection("users").doc(userId);
    const recentlyViewedRef = userRef.collection("recentlyViewed");

    try {
        // Check if the station already exists in recently viewed
        const existingDocs = await recentlyViewedRef.where("stationId", "==", stationId).get();

        if (!existingDocs.empty) {
            // If the station already exists, update its timestamp to mark it as most recent
            const existingDoc = existingDocs.docs[0];
            await recentlyViewedRef.doc(existingDoc.id).update({
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Otherwise, add the station with a timestamp
            await recentlyViewedRef.add({
                stationId: stationId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Ensure only the 5 most recent stations are kept
        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").get();
        const docs = snapshot.docs;

        if (docs.length > 5) {
            // Delete oldest entries beyond the 5 most recent
            const excessDocs = docs.slice(5);
            for (let doc of excessDocs) {
                await recentlyViewedRef.doc(doc.id).delete();
            }
        }
    } catch (error) {
        console.error("Error updating recently viewed stations:", error);
    }
}

// Display recently viewed stations on main.html
async function displayRecentlyViewedStations() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return;
    }

    const userId = user.uid;
    const recentlyViewedRef = db.collection("users").doc(userId).collection("recentlyViewed");

    try {
        // Get the 5 most recent stations in order
        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").limit(5).get();
        const recentlyViewedContainer = document.getElementById("recentlyViewedContainer");
        recentlyViewedContainer.innerHTML = ""; // Clear any previous data

        snapshot.forEach(doc => {
            const stationId = doc.data().stationId;
            const stationElement = document.createElement("div");
            stationElement.classList.add("recent-station");
            stationElement.textContent = `Station: ${stationId}`;
            
            // Optionally make the station clickable to view it again
            stationElement.onclick = () => {
                window.location.href = `station.html?stationId=${stationId}`;
            };

            recentlyViewedContainer.appendChild(stationElement);
        });
    } catch (error) {
        console.error("Error displaying recently viewed stations:", error);
    }
}

// Call `displayRecentlyViewedStations` on main.html
if (window.location.pathname.includes("main.html")) {
    document.addEventListener("DOMContentLoaded", displayRecentlyViewedStations);
}

// --- Station-specific functionality ---

if (window.location.pathname.includes("station.html")) {

    // Load the station data based on the stationId
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

    // Report safety level, store in both station and user history, and award aura points
    async function reportSafetyLevel(stationId, safetyLevel) {
        const user = firebase.auth().currentUser;

        if (!user) {
            console.error("No user is logged in.");
            document.getElementById("reportMessage").textContent = "Please log in to report safety levels.";
            return;
        }

        const userId = user.uid; // Get the logged-in user's unique ID
        console.log("Reporting Safety Level:", safetyLevel); // error logging - check if the function is called

        try {
            // Save the report in the station's safety reports collection
            const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");

            console.log("Writing to Firestore"); // error logging - check if firestore write is attempted
            await safetyReportsRef.add({
                userId: userId,
                safetyLevel: parseInt(safetyLevel),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Save the report in the user's report history
            const userReportsRef = db.collection("users").doc(userId).collection("reportHistory");
            await userReportsRef.add({
                stationId: stationId,
                safetyLevel: parseInt(safetyLevel),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Increment the user's aura points
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                auraPoints: firebase.firestore.FieldValue.increment(1)
            });

            // success message
            document.getElementById("reportMessage").textContent = "Safety level reported successfully. You've earned 1 aura point!";
            calculateAverageSafetyLevel(stationId); // refresh the average safety level
        } catch (error) {
            console.error('Error reporting safety level:', error);
            document.getElementById("reportMessage").textContent = "Failed to report safety level.";
        }
    }

    // Calculate and display the average safety level from reports within the last hour
    async function calculateAverageSafetyLevel(stationId) {
        const oneHourAgo = new Date(Date.now() - 3600000); // calculation for one hour ago
        const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");

        try {
            const recentReportsSnapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();
            const recentReports = recentReportsSnapshot.docs.map(doc => doc.data().safetyLevel);

            const averageSafetyLevel = recentReports.length
                ? (recentReports.reduce((sum, level) => sum + level, 0) / recentReports.length).toFixed(2)
                : "N/A";

            console.log("Calculated Average Safety Level:", averageSafetyLevel); // Logging for debugging

            // Update both the text and the bar with the average safety level
            document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;
            displayAverageSafetyLevelBar(averageSafetyLevel); // display average on the bar
        } catch (error) {
            console.error("Error calculating average safety level:", error);
        }
    }

    // Display the average safety level on a gradient bar
    function displayAverageSafetyLevelBar(averageSafetyLevel) {
        const overlay = document.getElementById("averageOverlay");
        if (averageSafetyLevel === "N/A") {
            overlay.textContent = "N/A";
            overlay.style.left = "0"; // Default position for "N/A"
        } else {
            overlay.textContent = averageSafetyLevel;

            // Calculate the position of the overlay (1 maps to 0%, 5 maps to 100%)
            const percentage = ((averageSafetyLevel - 1) / 4) * 100;
            overlay.style.left = `calc(${percentage}% - 20px)`; // Adjust -20px to center the overlay
        }
    }

    // Load station data and attach event listener to the button on page load
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOMContentLoaded triggered");

        const stationId = getStationIdFromURL();
        if (stationId) {
            loadStationData();
            addToRecentlyViewed(stationId); // Add station to recently viewed
        }

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
} else {
    console.log("Not on station.html; skipping station-specific JavaScript.");
}
