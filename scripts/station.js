// error logging
console.log("Hello from station JS");

// firebase init
if (!firebase.apps.length) {
    console.error("Firebase is not initialized. Check if firebaseConfig.js is loaded before station.js.");
}

// get stationId from URL
function getStationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("stationId");
}

// fisplay last 5 incident reports for that station
async function displayRecentIncidents(stationId) {
    try {
        const incidentReportsRef = db.collection("stations").doc(stationId).collection("incidentReports");
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
    } catch (error) {
        console.error("Error loading incident reports:", error);
    }
}

// load station data based on stationId
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
            calculateAverageSafetyLevel(stationId);
            displayRecentIncidents(stationId);
        } else {
            console.error("Station data not found.");
        }
    } catch (error) {
        console.error("Error loading station data:", error);
    }
}

// submit safety level report
async function reportSafetyLevel(stationId, safetyLevel) {
    const user = firebase.auth().currentUser;

    if (!user) {
        document.getElementById("successMessage").textContent = "Please log in to report safety levels.";
        document.getElementById("successMessage").style.color = "red";
        return;
    }

    const userId = user.uid;

    try {
        const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");
        const newReportRef = safetyReportsRef.doc();

        await newReportRef.set({
            userId: userId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // add aura points
        const userRef = db.collection("users").doc(userId);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(1),
        });

        // add to user history
        await userRef.collection("history").doc(newReportRef.id).set({
            type: "Safety Report",
            stationId: stationId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("successMessage").textContent = "Safety level reported successfully. You've earned 1 aura point!";
        document.getElementById("successMessage").style.color = "green";

        calculateAverageSafetyLevel(stationId);
    } catch (error) {
        console.error("Error reporting safety level:", error);
        document.getElementById("successMessage").textContent = "Failed to report safety level.";
        document.getElementById("successMessage").style.color = "red";
    }
}

// submit incident report
async function submitIncidentReport(stationId, title, details) {
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
        const incidentReportsRef = db.collection("stations").doc(stationId).collection("incidentReports");
        const newIncidentRef = incidentReportsRef.doc();

        await newIncidentRef.set({
            userId: user.uid,
            title: title || "No Title",
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // add aura points
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(3),
        });

        // add to user history
        await userRef.collection("history").doc(newIncidentRef.id).set({
            type: "Incident Report",
            stationId: stationId,
            title: title || "No Title",
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("successMessage").textContent = "Incident report submitted successfully. You've earned 3 aura points!";
        document.getElementById("successMessage").style.color = "green";

        displayRecentIncidents(stationId);
    } catch (error) {
        console.error("Error submitting incident report:", error);
        document.getElementById("successMessage").textContent = "Failed to submit the report.";
        document.getElementById("successMessage").style.color = "red";
    }
}

// overlay functionality for "Submit an Incident Report"
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
        const stationId = getStationIdFromURL();
        const title = document.getElementById("incidentTitle").value;
        const details = document.getElementById("incidentDetails").value;
        submitIncidentReport(stationId, title, details);
        overlay.style.display = "none";
        incidentForm.reset();
    });

    const reportButton = document.getElementById("reportSafetyButton");
    if (reportButton) {
        reportButton.addEventListener("click", () => {
            const safetyLevel = document.getElementById("safetyLevelInput").value;
            if (safetyLevel) {
                const stationId = getStationIdFromURL();
                reportSafetyLevel(stationId, parseInt(safetyLevel));
            } else {
                alert("Please select a safety level before submitting.");
            }
        });
    }

    const stationId = getStationIdFromURL();
    if (stationId) {
        loadStationData();
    }
});

// calculate and display average safety level
async function calculateAverageSafetyLevel(stationId) {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");

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
}