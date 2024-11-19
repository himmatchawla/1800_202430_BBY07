console.log("Bookmarks script loaded");

// Listen for authentication state changes
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        displayBookmarks(); // Fetch and display all bookmarks
    } else {
        console.log("User not logged in.");
        const bookmarksContainer = document.getElementById("bookmarks-go-here");
        if (bookmarksContainer) {
            bookmarksContainer.innerHTML = "<p>Please log in to view bookmarks.</p>";
        }
    }
});

// Display all bookmarks
async function displayBookmarks() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.warn("User not logged in. Cannot display bookmarks.");
        return;
    }

    const userId = user.uid;
    const bookmarksRef = db.collection("users").doc(userId).collection("bookmarks");
    const cardTemplate = document.getElementById("bookmarksTemplate");
    const container = document.getElementById("bookmarks-go-here");

    if (!cardTemplate || !container) {
        console.error("Card template or container not found.");
        return;
    }

    container.innerHTML = ""; // Clear container

    try {
        const snapshot = await bookmarksRef.get();

        if (snapshot.empty) {
            container.innerHTML = "<p>No bookmarks found.</p>";
            return;
        }

        snapshot.forEach(async (doc) => {
            const data = doc.data();
            const itemId = doc.id;
            const itemType = data.type; // "station" or "route"
            const itemName = data.name || "Unnamed Item";

            const newCard = cardTemplate.content.cloneNode(true);

            // Set header link and text
            const titleElement = newCard.querySelector(".bookmark-title");
            if (titleElement) {
                titleElement.textContent = itemName;
                titleElement.href = itemType === "station"
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // Calculate safety level
            const safetyLevel = await calculateAverageSafetyLevel(itemId, itemType);
            const safetyElement = newCard.querySelector(".bookmark-safety");
            if (safetyElement) {
                safetyElement.textContent = `Current Safety Level: ${safetyLevel}`;
            }

            // Fetch and display last incident timestamp
            const lastIncident = await getLastIncidentReportTime(itemId, itemType);
            const detailsElement = newCard.querySelector(".bookmark-details");
            if (detailsElement) {
                detailsElement.textContent = `Last Incident: ${lastIncident}`;
            }

            // Set "View Item" button link
            const viewButton = newCard.querySelector(".view-item");
            if (viewButton) {
                viewButton.href = itemType === "station"
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // Configure Remove Bookmark Button
            const removeButton = newCard.querySelector(".remove-bookmark");
            if (removeButton) {
                removeButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    removeBookmark(itemId, itemType, itemName);
                });
            }

            container.appendChild(newCard);
        });
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        container.innerHTML = "<p>Failed to load bookmarks. Please try again later.</p>";
    }
}

// Calculate Average Safety Level
async function calculateAverageSafetyLevel(itemId, itemType) {
    try {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const collection = itemType === "station" ? "stations" : "routes";
        const safetyReportsRef = db.collection(collection).doc(itemId).collection("safetyReports");
        const snapshot = await safetyReportsRef.where("timestamp", ">", oneHourAgo).get();

        const reports = snapshot.docs.map((doc) => doc.data().safetyLevel);
        return reports.length
            ? (reports.reduce((sum, level) => sum + level, 0) / reports.length).toFixed(2)
            : "N/A";
    } catch (error) {
        console.error("Error calculating safety level for:", itemId, error);
        return "N/A";
    }
}

// Get Last Incident Report Time
async function getLastIncidentReportTime(itemId, itemType) {
    try {
        const collection = itemType === "station" ? "stations" : "routes";
        const incidentReportsRef = db.collection(collection).doc(itemId).collection("incidentReports");
        const snapshot = await incidentReportsRef.orderBy("timestamp", "desc").limit(1).get();

        if (!snapshot.empty) {
            const lastIncident = snapshot.docs[0].data().timestamp?.toDate();
            return lastIncident ? new Date(lastIncident).toLocaleString() : "No recent incidents";
        } else {
            return "No recent incidents";
        }
    } catch (error) {
        console.error("Error fetching last incident for:", itemId, error);
        return "No recent incidents";
    }
}

// Remove Bookmark
async function removeBookmark(itemId, itemType, itemName) {
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Please log in to remove bookmarks.");
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        await bookmarkRef.delete();
        alert(`${itemType.toUpperCase()} "${itemName}" removed from bookmarks.`);
        displayBookmarks(); // Refresh the displayed bookmarks
    } catch (error) {
        console.error("Error removing bookmark:", error);
        alert("Failed to remove bookmark. Please try again.");
    }
}

async function bookmarkCurrentItem(itemId, type, name) {
    console.log("Bookmarking:", itemId, type, name);

    const user = firebase.auth().currentUser;
    if (!user) {
        document.getElementById("bookmarkMessage").textContent = "Please log in to bookmark items.";
        document.getElementById("bookmarkMessage").style.color = "red";
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        const isBookmarked = await checkBookmarkStatus(itemId);

        if (isBookmarked) {
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
    } catch (error) {
        console.error("Error bookmarking:", error);
        alert("Failed to bookmark. Please try again.");
    }
}
