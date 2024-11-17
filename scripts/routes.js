// ROUTES.JS HANDLES THE ROUTE.HTML PAGE AND ALLOWS FOR SAFETY REPORTING AND INCIDENT REPORTING

// error logging
console.log("Hello from routes.js");

// firebase init
if (!firebase.apps.length) {
    console.error("Firebase is not initialized. Check if firebaseConfig.js is loaded before routes.js.");
}

// get routeId from URL
function getRouteIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("routeId");
}

// display the last 5 incident reports for that route
async function displayRecentIncidents(routeId) {
    try { // try block
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
    } catch (error) {
        console.error("Error loading incident reports:", error);
    }
}

// load route data based on routeId
async function loadRouteData() {
    const routeId = getRouteIdFromURL();
    if (!routeId) {
        console.error("No route ID specified in URL.");
        return;
    }

    try { // try block
        const routeDoc = await db.collection("routes").doc(routeId).get();
        if (routeDoc.exists) {
            const routeData = routeDoc.data();
            document.getElementById("routeName").textContent = routeId || "Unknown";
            document.getElementById("routeDescription").textContent = `Description: ${routeData.description || "N/A"}`;
            calculateAverageSafetyLevel(routeId);
            displayRecentIncidents(routeId);
        } else {
            console.error("Route data not found."); 
        }
    } catch (error) {
        console.error("Error loading route data:", error);
    }
}

// submit safety level report
async function reportSafetyLevel(routeId, safetyLevel) {
    const user = firebase.auth().currentUser;

    if (!user) {
        document.getElementById("reportMessage").textContent = "Please log in to report safety levels.";
        return;
    }

    const userId = user.uid;

    try { // try block
        const safetyReportsRef = db.collection("routes").doc(routeId).collection("safetyReports");
        const newReportRef = safetyReportsRef.doc();

        await newReportRef.set({
            userId: userId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // add aura point
        const userRef = db.collection("users").doc(userId);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(1)
        });

        // add to user history
        await userRef.collection("history").doc(newReportRef.id).set({
            type: "Safety Report",
            routeId: routeId,
            safetyLevel: parseInt(safetyLevel),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("reportMessage").textContent = "Safety level reported successfully. You've earned 1 aura point!";
        calculateAverageSafetyLevel(routeId);
    } catch (error) {
        console.error("Error reporting safety level:", error);
        document.getElementById("reportMessage").textContent = "Failed to report safety level.";
    }
}

// submit incident report
async function submitIncidentReport(routeId, title, details) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("You must be logged in to submit a report.");
        return;
    }

    if (!details.trim()) {
        alert("Details field is required.");
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

        // add aura points
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(3)
        });

        // add to user history
        await userRef.collection("history").doc(newIncidentRef.id).set({
            type: "Incident Report",
            routeId: routeId,
            title: title || "No Title",
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        alert("Incident report submitted successfully. You've earned 3 aura points!");
        displayRecentIncidents(routeId);
    } catch (error) {
        console.error("Error submitting incident report:", error);
        alert("Failed to submit the report.");
    }
}

// overlay functionality for "Submit an Incident Report"
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("overlay");
    const submitReportBtn = document.getElementById("submitReportBtn");
    const closeOverlay = document.getElementById("closeOverlay");
    const overlayCard = document.getElementById("overlayCard");
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
        addToRecentlyViewed(routeId); // Update for routes
    }
});

// calculate and display the average safety level
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

// display average safety level on gradient bar
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
