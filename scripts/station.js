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
        const userRef = db.collection("users").doc(user.uid);
        await userRef.update({
            auraPoints: firebase.firestore.FieldValue.increment(1),
            
        });
        console.log("1 aurapoint added");
            

        document.getElementById("successMessage").textContent = "Safety level reported successfully. You've earned 1 aura point!";
        document.getElementById("successMessage").style.color = "green";

        // Recalculate safety level
        await calculateStationAverageSafetyLevel(stationId);
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
// Display the average safety level on a gradient bar
function displayAverageSafetyLevelBar(averageSafetyLevel) {
    console.log("Updating gradient bar with safety level:", averageSafetyLevel);
    const overlay = document.getElementById("averageOverlay");

    if (!overlay) {
        console.error("Gradient bar overlay not found in DOM.");
        return;
    }

    if (averageSafetyLevel === "N/A") {
        overlay.textContent = "N/A";
        overlay.style.left = "0";
        overlay.style.backgroundColor = "#ccc"; // Neutral color for N/A
        console.log("Set gradient bar to N/A.");
    } else {
        overlay.textContent = averageSafetyLevel;
        const percentage = ((averageSafetyLevel - 1) / 4) * 100; // Scale 1-5 to percentage
        overlay.style.left = `calc(${percentage}% - 20px)`;
        overlay.style.backgroundColor = getSafetyColor(averageSafetyLevel); // Set color
        console.log("Gradient bar updated with:", overlay.style.left, overlay.style.backgroundColor);
    }
}

// Calculate and display average safety level
async function calculateStationAverageSafetyLevel(stationId) {
    console.log("Calculating safety level for station ID:", stationId);
    const oneHourAgo = new Date(Date.now() - 3600000);
    const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");

    try {
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();
        const safetyLevels = snapshot.docs.map(doc => doc.data().safetyLevel);

        const averageSafetyLevel = safetyLevels.length
            ? (safetyLevels.reduce((sum, level) => sum + level, 0) / safetyLevels.length).toFixed(2)
            : "N/A";

        console.log("Calculated Average Safety Level:", averageSafetyLevel);

        document.getElementById("currentSafetyLevel").textContent = `Current Average Safety Level: ${averageSafetyLevel}`;
        displayAverageSafetyLevelBar(averageSafetyLevel);
    } catch (error) {
        console.error("Error calculating average safety level:", error);
    }
}


// Load station data
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
            console.log("Station data loaded successfully.");
            await calculateStationAverageSafetyLevel(stationId);
            await displayRecentIncidents(stationId);
        } else {
            console.error("Station data not found.");
        }
    } catch (error) {
        console.error("Error loading station data:", error);
    }
}


function getSafetyColor(averageSafetyLevel) {
    if (averageSafetyLevel < 2) {
        return "red"; // Unsafe
    } else if (averageSafetyLevel < 3) {
        return "orange"; // Moderately unsafe
    } else if (averageSafetyLevel < 4) {
        return "yellow"; // Neutral
    } else {
        return "green"; // Safe
    }
}


// Initialize Bookmark Button
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded event triggered"); // Debug log to verify listener is triggered
    const stationId = getStationIdFromURL();

    if (!stationId) {
        console.error("No station ID found in URL.");
        return;
    }

    // Fetch and load station data
    try {
        const stationDoc = await db.collection("stations").doc(stationId).get();

        if (stationDoc.exists) {
            const stationData = stationDoc.data();
            const stationName = stationData.name || "Unnamed Station";

            // Update station details in DOM
            const stationNameElement = document.getElementById("stationName");
            if (stationNameElement) {
                stationNameElement.textContent = stationName;
            }

            // Load additional station data
            await loadStationData(); // Call this to fetch station details, safety level, and incidents
        } else {
            console.error("Station document not found in Firestore.");
        }
    } catch (error) {
        console.error("Error fetching station data:", error);
    }

    // Set up the bookmark button
    const bookmarkButton = document.getElementById("bookmarkButton");
    if (bookmarkButton) {
        try {
            const stationDoc = await db.collection("stations").doc(stationId).get();
            const stationName = stationDoc.data()?.name || "Unnamed Station";

            // Check initial bookmark status
            const isBookmarked = await checkBookmarkStatus(stationId);
            bookmarkButton.textContent = isBookmarked ? "Remove Bookmark" : "Bookmark";

            // Add event listener for bookmarking
            bookmarkButton.addEventListener("click", async () => {
                await toggleBookmark(stationId, "station", stationName);

                // Update button text after toggling
                const updatedStatus = await checkBookmarkStatus(stationId);
                bookmarkButton.textContent = updatedStatus ? "Remove Bookmark" : "Bookmark";

                console.log(`Bookmark toggled for Station ID: ${stationId}, Name: ${stationName}`);
            });
        } catch (error) {
            console.error("Error setting up bookmark button:", error);
        }
    } else {
        console.error("Bookmark button not found in DOM.");
    }
});

