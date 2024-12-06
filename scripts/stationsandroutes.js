//STATIONSANDROUTES.JS HANDLES THE MAIN FUNCTIONALITY OF THE WEB APP (REPORTING/VIEWING ETC)

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
    try { // try block for error handling
        const incidentReportsRef = db.collection(collection).doc(documentId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(5).get();
        const incidentsContainer = document.getElementById("recentIncidents");

        if (!incidentsContainer) { // if the container is not found, log error
            console.error("Incidents container not found.");
            return;
        }

        incidentsContainer.innerHTML = "";

        snapshot.forEach((doc) => { // display incidents
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
    } catch (error) { // error handling
        console.error("Error displaying recent incidents:", error);
    }
}

// reporting incidents (general to stations AND routes)
function setupIncidentReportButton(collection) {
    const overlay = document.getElementById("overlay");
    const closeOverlay = document.getElementById("closeOverlay");
    const submitReportBtn = document.getElementById("submitReportBtn");
    const incidentForm = document.getElementById("incidentForm");
    const messageBox = document.getElementById("incidentMessageBox");

    if (!overlay || !closeOverlay || !submitReportBtn || !incidentForm || !messageBox) { // if any of the elements are not found, log error
        console.error("Incident report overlay or buttons not found.");
        return;
    }

    // open overlay when "Submit an Incident Report" button is clicked
    submitReportBtn.addEventListener("click", () => {
        overlay.style.display = "flex";
    });

    // close the overlay when the close button is clicked
    closeOverlay.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    // submit form
    incidentForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // prevent page reload

        const title = document.getElementById("incidentTitle").value;
        const details = document.getElementById("incidentDetails").value;
        const documentId = getStationIdFromURL() || getRouteIdFromURL();

        if (!documentId) { // if no station or route ID found in the URL
            messageBox.textContent = "Unable to identify the station or route.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = "";
            }, 5000);
            return;
        }

        if (!details.trim()) { // details are required
            messageBox.textContent = "Details field is required.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = "";
            }, 5000);
            return;
        }

        try { // try block for error handling
            const user = firebase.auth().currentUser;
            if (!user) { // user cannot submit incident report if not logged in
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

            // add the incident report
            const reportId = newIncidentRef.id;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await newIncidentRef.set({
                userId: userId,
                title: title || "No Title",
                details: details,
                timestamp,
            });

            // increment aura points
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                auraPoints: firebase.firestore.FieldValue.increment(5),
            });

            // add to user's report history
            const reportHistoryRef = userRef.collection("reportHistory").doc(reportId);
            await reportHistoryRef.set({
                type: "incidentReport",
                collection: collection,
                documentId: documentId,
                title: title || "No Title",
                details: details,
                timestamp,
            });

            overlay.style.display = "none"; // close overlay
            swal("Incident report submitted successfully!", "You earned 5 Aura Points.", "success");


            await displayRecentIncidents(collection, documentId); // refresh the recent incidents
        } catch (error) { // error handling
            console.error("Error submitting incident report:", error);
            messageBox.textContent = "Failed to submit the report. Please try again.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => {
                messageBox.style.display = "none";
                messageBox.textContent = "";
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

    if (!reportButton || !messageBox) { // if the button or message box is not found, log error
        console.error("Report safety button or message box not found.");
        return;
    }

    reportButton.addEventListener("click", async () => { // submit safety level report
        const safetyLevelInput = document.getElementById("safetyLevelInput");
        const documentId = getStationIdFromURL() || getRouteIdFromURL(); // get document ID from the URL

        if (!safetyLevelInput || !documentId) { // if safety level input or document ID is missing
            messageBox.textContent = "Safety level input or document ID is missing.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
            return;
        }

        const safetyLevel = parseInt(safetyLevelInput.value, 10);
        if (isNaN(safetyLevel)) { // safety level must be a number
            messageBox.textContent = "Please select a valid safety level.";
            messageBox.style.color = "red";
            messageBox.style.display = "block";
            setTimeout(() => (messageBox.style.display = "none"), 5000);
            return;
        }

        try { // try block for error handling
            const user = firebase.auth().currentUser;
            if (!user) { // user cannot submit safety report if not logged in
                messageBox.textContent = "Please log in to submit a safety report.";
                messageBox.style.color = "red";
                messageBox.style.display = "block";
                setTimeout(() => (messageBox.style.display = "none"), 5000);
                return;
            }

            const userId = user.uid;
            const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
            const newReportRef = safetyReportsRef.doc();

            // add the safety report
            const reportId = newReportRef.id;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            await newReportRef.set({
                userId: userId,
                safetyLevel,
                timestamp,
            });

            // increment aura points
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
                auraPoints: firebase.firestore.FieldValue.increment(2),
            });

            // add to user's report history
            const reportHistoryRef = userRef.collection("reportHistory").doc(reportId);
            await reportHistoryRef.set({
                type: "safetyReport",
                collection: collection,
                documentId: documentId,
                safetyLevel,
                timestamp,
            });

            // wait for firestore to process new document / promise
            await new Promise((resolve) => setTimeout(resolve, 500));

            // recalculate avg safety lvl and update the bar (again)
            const updatedAverage = await calculateAverageSafetyLevel(collection, documentId);
            const averageSafetyLevelElement = document.getElementById("currentSafetyLevel");
            if (averageSafetyLevelElement) {
                averageSafetyLevelElement.textContent = `Current Average Safety Level: ${updatedAverage}`;
            }
            await updateSafetyBar(collection, documentId);

            // show success message
            swal("Safety level reported successfully!", "You earned 2 Aura Points.", "success");

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
    const safetyReportInfo = document.getElementById("safetyReportInfo");

    if (!averageOverlay || !safetyBar || !safetyReportInfo) { // if any of the elements are not found, log error
        console.error("Gradient bar, overlay, or info text not found.");
        return;
    }

    try { // try block for error handling
        // get safety reports from firestore
        const oneHourAgo = new Date(Date.now() - 3600000);
        const safetyReportsRef = db.collection(collection).doc(documentId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        const reports = snapshot.docs.map((doc) => doc.data().safetyLevel);

        // calculate average safety level
        const average = reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";

        console.log("Average for gradient bar:", average);
        console.log("Number of reports:", reports.length);

        // update overlay text
        averageOverlay.textContent = average === "N/A" ? "N/A" : average;

        // set gradient based on average
        if (average !== "N/A" && !isNaN(average)) {
            const percentage = (average / 5) * 100; // max safety level is 5
            safetyBar.style.background = `linear-gradient(90deg, red, yellow ${percentage}%, green)`;

            averageOverlay.style.left = `calc(${percentage}% - 20px)`; // Adjust position to center text

            // how many reports did this come from?
            safetyReportInfo.innerHTML = `The Safety Level is derived from <strong>${reports.length}</strong> report(s) in the last hour.`;
        } else {
            // Set gradient red to green
            safetyBar.style.background = "linear-gradient(90deg, red, yellow, green)";
            averageOverlay.textContent = "N/A";

            // update info text for no reports
            safetyReportInfo.textContent = "No reports in the last hour.";
        }
    } catch (error) { // error handling
        console.error("Error updating safety bar:", error);
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

    try { // try block for error handling
        const stationDoc = await db.collection("stations").doc(stationId).get();
        if (stationDoc.exists) { // if the station document exists, display the data
            const data = stationDoc.data();
            document.getElementById("stationName").textContent = data.name || "Unnamed Station";

            // calculate and display the average safety level
            const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);
            document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;

            // update the gradient bar with the average station safety level
            await updateSafetyBar("stations", stationId);

            // display recent incidents for the station
            await displayRecentIncidents("stations", stationId);
        }
    } catch (error) { // error handling
        console.error("Error loading station data:", error);
    }
}

// load route data
async function loadRouteData() {
    const routeId = getRouteIdFromURL();
    if (!routeId) return;

    try { // try block for error handling
        const routeDoc = await db.collection("routes").doc(routeId).get();
        if (routeDoc.exists) { // if the route document exists, display the data
            const data = routeDoc.data();

            // if no name is provided in the document, use the document ID (routeId)
            const routeName = data.name || routeId;
            document.getElementById("routeName").textContent = routeName;

            // calculate and display the average safety level
            const averageSafetyLevel = await calculateRoutesAverageSafetyLevel(routeId);
            document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;

            // update the gradient bar w average safety level
            await updateSafetyBar("routes", routeId);

            // display recent incidents for the route
            await displayRecentIncidents("routes", routeId);
        } else {
            console.warn(`Route document with ID "${routeId}" does not exist.`);
            document.getElementById("routeName").textContent = `Route Not Found (${routeId})`;
        }
    } catch (error) {
        console.error("Error loading route data:", error);
    }
}

//--------------------- AURA POINTS TITLE ----------------------------

async function displayUserAuraPoints(userId) {
    try {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const auraPoints = userDoc.data().auraPoints || 0;
            const title = calculateTitle(auraPoints);

            const auraPointsDisplay = document.getElementById("userAuraPoints");
            auraPointsDisplay.innerHTML = `
                <p><strong>Points:</strong> ${auraPoints}</p>
                <p><strong>Title:</strong> ${title}</p>
            `;
        } else {
            console.error("User document not found!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}


async function handleAuraPointIncrement(userId, incrementBy) {
    const userRef = db.collection("users").doc(userId);

    try {
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(incrementBy),
        });

        // Call the new display function
        await displayUserAuraPoints(userId);
    } catch (error) {
        console.error("Error updating aura points:", error);
    }
}


//----------EVENT LISTENER----------

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