console.log("stationsandroutes.js loaded");

// ----------INITIALIZATION----------

// extracting station ID from URL
function getStationIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("stationId");
}

// extracting route ID from URL
function getRouteIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("routeId");
}

// ----------INCIDENTS----------

// display recent incidents (general to stations AND routes)
async function displayRecentIncidents(collection, documentId) {
    try {
        const incidentReportsRef = db.collection(collection).doc(documentId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(5).get();
        const incidentsContainer = document.getElementById("recentIncidents");

        if (!incidentsContainer) {
            console.error("Incidents container not found.");
            return;
        }

        incidentsContainer.innerHTML = "";

        snapshot.forEach((doc) => {
            const incident = doc.data();
            const incidentElement = document.createElement("div");
            incidentElement.classList.add("incident");
            incidentElement.innerHTML = `
                <h5>${incident.title || "Untitled Incident"}</h5>
                <p>${incident.details}</p>
                <small>${incident.timestamp?.toDate().toLocaleString() || "Unknown time"}</small>
                <hr>
            `;
            incidentsContainer.appendChild(incidentElement);
        });
    } catch (error) {
        console.error("Error displaying recent incidents:", error);
    }
}

// reporting incidents (general to stations AND routes)
function setupIncidentReportButton(collection) {
    const overlay = document.getElementById("overlay");
    const closeOverlay = document.getElementById("closeOverlay");
    const submitReportBtn = document.getElementById("submitReportBtn");
    const incidentForm = document.getElementById("incidentForm");
    const messageBox = document.getElementById("incidentMessageBox"); // Message box element

    if (!overlay || !closeOverlay || !submitReportBtn || !incidentForm || !messageBox) {
        console.error("Incident report overlay or buttons not found.");
        return;
    }

    // Open the overlay when "Submit an Incident Report" button is clicked
    submitReportBtn.addEventListener("click", () => {
        overlay.style.display = "block";
    });

    // Close the overlay when the close button is clicked
    closeOverlay.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    // Submit the form
    incidentForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        const title = document.getElementById("incidentTitle").value;
        const details = document.getElementById("incidentDetails").value;
        const documentId = getStationIdFromURL() || getRouteIdFromURL(); // Get the document ID from the URL

        if (!documentId) {
            messageBox.textContent = "Unable to identify the station or route.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = ""; // Clear the message
            }, 5000);
            return;
        }

        if (!details.trim()) {
            messageBox.textContent = "Details field is required.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = ""; // Clear the message
            }, 5000);
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                messageBox.textContent = "Please log in to submit an incident report.";
                messageBox.style.color = "red";
                messageBox.style.display = "block";
                setTimeout(() => {
                    messageBox.style.display = "none";
                }, 5000);
                return;
            }

            const userId = user.uid;
            const incidentReportsRef = db.collection(collection).doc(documentId).collection("incidentReports");
            const newIncidentRef = incidentReportsRef.doc();

            // Add the incident report
            const reportId = newIncidentRef.id;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await newIncidentRef.set({
                userId: userId,
                title: title || "No Title",
                details: details,
                timestamp,
            });

            // Increment aura points
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                auraPoints: firebase.firestore.FieldValue.increment(3),
            });

            // Add to user's report history
            const reportHistoryRef = userRef.collection("reportHistory").doc(reportId);
            await reportHistoryRef.set({
                type: "incidentReport",
                collection: collection, // "stations" or "routes"
                documentId: documentId, // ID of the station or route
                title: title || "No Title",
                details: details,
                timestamp,
            });

            messageBox.textContent = "Incident report submitted successfully! You earned 3 Aura Points.";
            messageBox.style.color = "green";
            messageBox.style.display = "block";
            overlay.style.display = "none"; // Close the overlay
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = ""; // Clear the message
            }, 5000);

            await displayRecentIncidents(collection, documentId); // Refresh the recent incidents
        } catch (error) {
            console.error("Error submitting incident report:", error);
            messageBox.textContent = "Failed to submit the report. Please try again.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = ""; // Clear the message
            }, 5000);
        }
    });
}




//----------SAFETY LEVELS----------

// consumer function for calculateAverageSafetyLevel for stations
async function calculateStationAverageSafetyLevel(stationId) {
    return await calculateAverageSafetyLevel("stations", stationId);
}

// consumer function for calculateAverageSafetyLevel for routes
async function calculateRoutesAverageSafetyLevel(routeId) {
    return await calculateAverageSafetyLevel("routes", routeId);
}

// reporting safety level (general to stations AND routes)
function setupReportSafetyLevelButton(collection) {
    const reportButton = document.getElementById("reportSafetyButton");
    const messageBox = document.getElementById("messageBox");

    if (!reportButton || !messageBox) {
        console.error("Report safety button or message box not found.");
        return;
    }

    reportButton.addEventListener("click", async () => {
        const safetyLevelInput = document.getElementById("safetyLevelInput");
        const documentId = getStationIdFromURL() || getRouteIdFromURL(); // Get the document ID from the URL

        if (!safetyLevelInput || !documentId) {
            messageBox.textContent = "Safety level input or document ID is missing.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
            return;
        }

        const safetyLevel = parseInt(safetyLevelInput.value, 10);
        if (isNaN(safetyLevel)) {
            messageBox.textContent = "Please select a valid safety level.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                messageBox.textContent = "Please log in to submit a safety report.";
                messageBox.style.color = "red";
                messageBox.style.display = "block";
                setTimeout(() => (messageBox.style.display = "none"), 5000);
                return;
            }

            const userId = user.uid;
            const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
            const newReportRef = safetyReportsRef.doc();

            // Add the safety report
            const reportId = newReportRef.id;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await newReportRef.set({
                userId: userId,
                safetyLevel,
                timestamp,
            });

            // Increment aura points
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                auraPoints: firebase.firestore.FieldValue.increment(1),
            });

            // Add to user's report history
            const reportHistoryRef = userRef.collection("reportHistory").doc(reportId);
            await reportHistoryRef.set({
                type: "safetyReport",
                collection: collection, // "stations" or "routes"
                documentId: documentId, // ID of the station or route
                safetyLevel,
                timestamp,
            });

            // Wait briefly for Firestore to process the new document
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Recalculate and update the bar
            const updatedAverage = await calculateAverageSafetyLevel(collection, documentId);
            const averageSafetyLevelElement = document.getElementById("currentSafetyLevel");
            if (averageSafetyLevelElement) {
                averageSafetyLevelElement.textContent = `Current Average Safety Level: ${updatedAverage}`;
            }
            await updateSafetyBar(collection, documentId);

            // Show success message
            messageBox.textContent = "Safety level reported successfully! You earned 1 Aura Point.";
            messageBox.style.color = "green";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
        } catch (error) {
            console.error("Error reporting safety level:", error);
            messageBox.textContent = "Failed to report safety level. Please try again.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
        }
    });
}


// gradient bar display (general to stations AND routes)
async function updateSafetyBar(collection, documentId) {
    const averageOverlay = document.getElementById("averageOverlay");
    const safetyBar = document.querySelector(".safety-bar");
    const safetyReportInfo = document.getElementById("safetyReportInfo"); // New info text element

    if (!averageOverlay || !safetyBar || !safetyReportInfo) {
        console.error("Gradient bar, overlay, or info text not found.");
        return;
    }

    try {
        // Fetch safety reports from Firestore
        const oneHourAgo = new Date(Date.now() - 3600000);
        const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        const reports = snapshot.docs.map((doc) => doc.data().safetyLevel);

        // Calculate average safety level
        const average = reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";

        console.log("Average for gradient bar:", average);
        console.log("Number of reports:", reports.length);

        // Update overlay text
        averageOverlay.textContent = average === "N/A" ? "N/A" : average;

        // Set gradient based on average
        if (average !== "N/A" && !isNaN(average)) {
            const percentage = (average / 5) * 100; // Max safety level is 5
            safetyBar.style.background = `linear-gradient(90deg, red, yellow ${percentage}%, green)`;

            // Position the overlay dynamically
            averageOverlay.style.left = `calc(${percentage}% - 20px)`; // Adjust position to center text

            // Update info text
            safetyReportInfo.textContent = `The Safety Level is derived from ${reports.length} report(s) in the last hour.`;
        } else {
            // Full gradient for no data
            safetyBar.style.background = "linear-gradient(90deg, red, yellow, green)";
            averageOverlay.textContent = "N/A";

            // Update info text for no reports
            safetyReportInfo.textContent = "No reports in the last hour.";
        }
    } catch (error) {
        console.error("Error updating safety bar:", error);

        // Handle errors gracefully
        safetyBar.style.background = "linear-gradient(90deg, red, yellow, green)";
        averageOverlay.textContent = "N/A";
        safetyReportInfo.textContent = "No reports in the last hour.";
    }
}


// ----------LOADING DATA----------

// load station data
async function loadStationData() {
    const stationId = getStationIdFromURL();
    if (!stationId) return;

    try {
        const stationDoc = await db.collection("stations").doc(stationId).get();
        if (stationDoc.exists) {
            const data = stationDoc.data();
            document.getElementById("stationName").textContent = data.name || "Unnamed Station";

            const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);
            document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;

            // update the gradient bar with the average station safety level
            await updateSafetyBar("stations", stationId);

            await displayRecentIncidents("stations", stationId);
        }
    } catch (error) {
        console.error("Error loading station data:", error);
    }
}

// load route data
async function loadRouteData() {
    const routeId = getRouteIdFromURL(); // Extract the routeId from the URL
    if (!routeId) return;

    try {
        const routeDoc = await db.collection("routes").doc(routeId).get(); // Fetch the route document from Firestore
        if (routeDoc.exists) {
            const data = routeDoc.data(); // Get route data

            // If no name is provided in the document, use the document ID (routeId)
            const routeName = data.name || routeId;
            document.getElementById("routeName").textContent = routeName; // Display the route name or ID

            // Calculate and display the average safety level
            const averageSafetyLevel = await calculateRoutesAverageSafetyLevel(routeId);
            document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;

            // Update the gradient bar
            await updateSafetyBar("routes", routeId);

            // Display recent incidents for the route
            await displayRecentIncidents("routes", routeId);
        } else {
            console.warn(`Route document with ID "${routeId}" does not exist.`);
            document.getElementById("routeName").textContent = `Route Not Found (${routeId})`;
        }
    } catch (error) {
        console.error("Error loading route data:", error);
    }
}


//----------MAIN EVENT LISTENER----------

// dom content loaded event listener
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded triggered");
    const pathname = window.location.pathname;

    if (pathname.includes("station.html")) {
        console.log("Loading station functionality");
        loadStationData();
        setupReportSafetyLevelButton("stations");
        setupIncidentReportButton("stations");
    } else if (pathname.includes("route.html")) {
        console.log("Loading route functionality");
        loadRouteData();
        setupReportSafetyLevelButton("routes");
        setupIncidentReportButton("routes");
    }
});