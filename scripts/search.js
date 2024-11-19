// Search script loaded
console.log("Search script loaded");

// Display search results
function displaySearchResults(collection) {
    const cardTemplate = document.getElementById("stationsTemplate");
    const container = document.getElementById("stations-go-here");

    if (!cardTemplate || !container) {
        console.error("Card template or container not found.");
        return;
    }

    container.innerHTML = ""; // Clear container

    db.collection(collection)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.warn("No documents found in collection:", collection);
                return;
            }

            querySnapshot.forEach(async (doc) => {
                const data = doc.data();
                const stationId = doc.id;
                const stationName = data.name || "Unnamed Station";

                const newCard = cardTemplate.content.cloneNode(true);

                // Set header link and text
                const titleElement = newCard.querySelector(".station-title");
                if (titleElement) {
                    titleElement.textContent = stationName;
                    titleElement.href = `station.html?stationId=${stationId}`;
                }

                // Calculate safety level
                const safetyLevel = await calculateAverageSafetyLevel(stationId);
                const safetyElement = newCard.querySelector(".station-safety");
                if (safetyElement) {
                    safetyElement.textContent = `Current Safety Level: ${safetyLevel}`;
                }

                // Fetch and display last incident timestamp
                const lastIncident = await getLastIncidentReportTime(stationId);
                const detailsElement = newCard.querySelector(".station-details");
                if (detailsElement) {
                    detailsElement.textContent = `Last Incident: ${lastIncident}`;
                }

                // Set "View Station" button link
                const viewStationButton = newCard.querySelector(".view-station");
                if (viewStationButton) {
                    viewStationButton.href = `station.html?stationId=${stationId}`;
                }

                // Configure Bookmark Button
                const bookmarkButton = newCard.querySelector(".bookmark-button");
                if (bookmarkButton) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        const isBookmarked = await checkBookmarkStatus(stationId);
                        bookmarkButton.textContent = isBookmarked ? "Remove Bookmark" : "Bookmark";
                        bookmarkButton.addEventListener("click", () =>
                            toggleBookmark(stationId, "station", stationName)
                        );
                    } else {
                        bookmarkButton.textContent = "Bookmark";
                        bookmarkButton.disabled = true;
                        bookmarkButton.title = "Log in to use bookmarks";
                    }
                }

                container.appendChild(newCard);
            });
        })
        .catch((error) => {
            console.error("Error fetching search results:", error);
        });
}

// Calculate Average Safety Level
async function calculateAverageSafetyLevel(stationId) {
    try {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const safetyReportsRef = db.collection("stations").doc(stationId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        const reports = snapshot.docs.map((doc) => doc.data().safetyLevel);
        return reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";
    } catch (error) {
        console.error("Error calculating safety level for:", stationId, error);
        return "N/A";
    }
}

// Get Last Incident Report Time
async function getLastIncidentReportTime(stationId) {
    try {
        const incidentReportsRef = db.collection("stations").doc(stationId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(1).get();

        if (!snapshot.empty) {
            const lastIncident = snapshot.docs[0].data().timestamp?.toDate();
            return lastIncident ? new Date(lastIncident).toLocaleString() : "No recent incidents";
        } else {
            return "No recent incidents";
        }
    } catch (error) {
        console.error("Error fetching last incident for:", stationId, error);
        return "No recent incidents";
    }
}

// Check Bookmark Status
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

// Toggle Bookmark
async function toggleBookmark(itemId, type, name) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Please log in to bookmark items.");
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        const doc = await bookmarkRef.get();

        if (doc.exists) {
            await bookmarkRef.delete();
            alert(`${type.toUpperCase()} "${name}" removed from bookmarks.`);
        } else {
            await bookmarkRef.set({
                type,
                name,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
            alert(`${type.toUpperCase()} "${name}" bookmarked successfully.`);
        }

        // Update button text
        displaySearchResults("stations");
    } catch (error) {
        console.error("Error toggling bookmark:", error);
    }
}

// Input Filtering
function filterSearchResults() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach((card) => {
        const title = card.querySelector(".station-title")?.textContent.toLowerCase();
        card.style.display = title?.includes(searchTerm) ? "block" : "none";
    });
}

// Event Listener for Filtering
document.getElementById("searchInput")?.addEventListener("input", filterSearchResults);

// Load Search Results on Page Load
document.addEventListener("DOMContentLoaded", () => {
    displaySearchResults("stations");
});
