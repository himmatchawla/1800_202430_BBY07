// Search script for routes loaded
console.log("Search script for routes loaded");

// Display search results for routes
function displaySearchResultsForRoutes(collection) {
    const cardTemplate = document.getElementById("routesTemplate");
    const container = document.getElementById("routes-go-here");

    if (!cardTemplate || !container) {
        console.error("Card template or container not found for routes.");
        return;
    }

    container.innerHTML = ""; // Clear the container

    db.collection(collection)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.warn("No documents found in collection:", collection);
                return;
            }

            querySnapshot.forEach(async (doc) => {
                const routeId = doc.id; // Route name is derived from document ID
                const routeName = routeId;

                const newCard = cardTemplate.content.cloneNode(true);

                // Set header link and text
                const titleElement = newCard.querySelector(".routes-title");
                if (titleElement) {
                    titleElement.textContent = routeName;
                    titleElement.href = `route.html?routeId=${routeId}`;
                }

                // Calculate safety level
                const safetyLevel = await calculateAverageSafetyLevelForRoutes(routeId);
                const safetyElement = newCard.querySelector(".routes-safetyLevel");
                if (safetyElement) {
                    safetyElement.textContent = `Safety Level: ${safetyLevel}`;
                }

                // Fetch and display last incident timestamp
                const lastIncident = await getLastIncidentReportTimeForRoutes(routeId);
                const detailsElement = newCard.querySelector(".routes-details");
                if (detailsElement) {
                    detailsElement.textContent = `Last Incident: ${lastIncident}`;
                }

                // Set "View Route" button link
                const viewRouteButton = newCard.querySelector(".view-routes");
                if (viewRouteButton) {
                    viewRouteButton.href = `route.html?routeId=${routeId}`;
                }

                // Configure Bookmark Button
                const bookmarkButton = newCard.querySelector(".bookmark-button");
                if (bookmarkButton) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        const isBookmarked = await checkBookmarkStatus(routeId);
                        bookmarkButton.textContent = isBookmarked ? "Remove Bookmark" : "Bookmark";
                        bookmarkButton.addEventListener("click", () =>
                            toggleBookmark(routeId, "route", routeName)
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
            console.error("Error fetching search results for routes:", error);
        });
}

// Calculate Average Safety Level for Routes
async function calculateAverageSafetyLevelForRoutes(routeId) {
    try {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const safetyReportsRef = db.collection("routes").doc(routeId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        const reports = snapshot.docs.map((doc) => doc.data().safetyLevel);
        return reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";
    } catch (error) {
        console.error("Error calculating safety level for route:", routeId, error);
        return "N/A";
    }
}

// Get Last Incident Report Time for Routes
async function getLastIncidentReportTimeForRoutes(routeId) {
    try {
        const incidentReportsRef = db.collection("routes").doc(routeId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(1).get();

        if (!snapshot.empty) {
            const lastIncident = snapshot.docs[0].data().timestamp?.toDate();
            return lastIncident ? new Date(lastIncident).toLocaleString() : "No recent incidents";
        } else {
            return "No recent incidents";
        }
    } catch (error) {
        console.error("Error fetching last incident for route:", routeId, error);
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
        displaySearchResultsForRoutes("routes");
    } catch (error) {
        console.error("Error toggling bookmark:", error);
    }
}

// Input Filtering
function filterSearchResultsForRoutes() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach((card) => {
        const title = card.querySelector(".routes-title")?.textContent.toLowerCase();
        card.style.display = title?.includes(searchTerm) ? "block" : "none";
    });
}

// Event Listener for Filtering
document.getElementById("searchInput")?.addEventListener("input", filterSearchResultsForRoutes);

// Load Search Results for Routes on Page Load
document.addEventListener("DOMContentLoaded", () => {
    displaySearchResultsForRoutes("routes");
});
