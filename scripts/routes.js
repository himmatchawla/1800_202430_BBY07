// Error logging
console.log("Hello from routes.js");

// Firebase initialization
if (!firebase.apps.length) {
    console.error("Firebase is not initialized. Check if firebaseConfig.js is loaded before routes.js.");
}

// Get routeId from URL
function getRouteIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("routeId");
}

// Display the last 5 incident reports for the route
async function displayRecentIncidents(routeId) {
    try {
        const incidentReportsRef = db.collection("routes").doc(routeId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(5).get();
        const incidentsContainer = document.getElementById("recentIncidents");

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

        if (snapshot.empty) {
            incidentsContainer.innerHTML = "<p>No incidents reported for this route yet.</p>";
        }
    } catch (error) {
        console.error("Error loading incident reports:", error);
    }
}

// Load route data based on routeId
async function loadRouteData() {
    const routeId = getRouteIdFromURL();
    if (!routeId) {
        console.error("No route ID specified in URL.");
        return;
    }

    try {
        document.getElementById("routeName").textContent = routeId;

        await calculateAverageSafetyLevel(routeId);

        await displayRecentIncidents(routeId);
    } catch (error) {
        console.error("Error loading route data:", error);
    }
}

// Submit safety level report
async function reportSafetyLevel(routeId, safetyLevel) {
    const user = firebase.auth().currentUser;

    if (!user) {
        document.getElementById("successMessage").textContent = "Please log in to report safety levels.";
        document.getElementById("successMessage").style.color = "red";
        return;
    }

    const userId = user.uid;

    try {
        const safetyReportsRef = db.collection("routes").doc(routeId).collection("safetyReports");
        const newReportRef = safetyReportsRef.doc();

        await newReportRef.set({
            userId: userId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Add aura points
        const userRef = db.collection("users").doc(userId);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(1),
        });

        // Add to user history
        await userRef.collection("history").doc(newReportRef.id).set({
            type: "Safety Report",
            routeId: routeId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("successMessage").textContent = "Safety level reported successfully. You've earned 1 aura point!";
        document.getElementById("successMessage").style.color = "green";

        await calculateAverageSafetyLevel(routeId);
    } catch (error) {
        console.error("Error reporting safety level:", error);
        document.getElementById("successMessage").textContent = "Failed to report safety level.";
        document.getElementById("successMessage").style.color = "red";
    }
}

// Submit incident report
async function submitIncidentReport(routeId, title, details) {
    const user = firebase.auth().currentUser;
    if (!user) {
        document.getElementById("successMessage").textContent = "You must be logged in to submit a report.";
        document.getElementById("successMessage").style.color = "red";
        return;
    }

    if (!details.trim()) {
        document.getElementById("successMessage").textContent = "Details field is required.";
        document.getElementById("successMessage").style.color = "red";
        return;
    }

    try {
        const incidentReportsRef = db.collection("routes").doc(routeId).collection("incidentReports");
        const newIncidentRef = incidentReportsRef.doc();

        await newIncidentRef.set({
            userId: user.uid,
            title: title || "No Title",
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Add aura points
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(3),
        });

        // Add to user history
        await userRef.collection("history").doc(newIncidentRef.id).set({
            type: "Incident Report",
            routeId: routeId,
            title: title || "No Title",
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("successMessage").textContent = "Incident report submitted successfully. You've earned 3 aura points!";
        document.getElementById("successMessage").style.color = "green";

        displayRecentIncidents(routeId);
    } catch (error) {
        console.error("Error submitting incident report:", error);
        document.getElementById("successMessage").textContent = "Failed to submit the report.";
        document.getElementById("successMessage").style.color = "red";
    }
}

// Overlay functionality for "Submit an Incident Report"
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("overlay");
    const submitReportBtn = document.getElementById("submitReportBtn");
    const closeOverlay = document.getElementById("closeOverlay");
    const incidentForm = document.getElementById("incidentForm");

    submitReportBtn.addEventListener("click", () => {
        overlay.style.display = "flex";
    });

    closeOverlay.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.style.display = "none";
        }
    });

    incidentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const routeId = getRouteIdFromURL();
        const title = document.getElementById("incidentTitle").value;
        const details = document.getElementById("incidentDetails").value;
        submitIncidentReport(routeId, title, details);
        overlay.style.display = "none";
        incidentForm.reset();
    });

    const reportButton = document.getElementById("reportSafetyButton");
    if (reportButton) {
        reportButton.addEventListener("click", () => {
            const safetyLevel = document.getElementById("safetyLevelInput").value;
            if (safetyLevel) {
                const routeId = getRouteIdFromURL();
                reportSafetyLevel(routeId, parseInt(safetyLevel));
            } else {
                alert("Please select a safety level before submitting.");
            }
        });
    }

    const routeId = getRouteIdFromURL();
    if (routeId) {
        loadRouteData();
    }
});

// Calculate and display average safety level
async function calculateAverageSafetyLevel(routeId) {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const safetyReportsRef = db.collection("routes").doc(routeId).collection("safetyReports");

    try {
        const recentReportsSnapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();
        const recentReports = recentReportsSnapshot.docs.map(doc => doc.data().safetyLevel);

        const averageSafetyLevel = recentReports.length
            ? (recentReports.reduce((sum, level) => sum + level, 0) / recentReports.length).toFixed(2)
            : "N/A";

        document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;
        displayAverageSafetyLevelBar(averageSafetyLevel);
    } catch (error) {
        console.error("Error calculating average safety level:", error);
    }
}

// Display the average safety level on a gradient bar
function displayAverageSafetyLevelBar(averageSafetyLevel) {
    const overlay = document.getElementById("averageOverlay");
    if (averageSafetyLevel === "N/A") {
        overlay.textContent = "N/A";
        overlay.style.left = "0";
    } else {
        overlay.textContent = averageSafetyLevel;
        const percentage = ((averageSafetyLevel - 1) / 4) * 100;
        overlay.style.left = `calc(${percentage}% - 20px)`;
    }
};
