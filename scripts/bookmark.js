console.log("Bookmarks script loaded");

// Bookmark an item (station or route)
async function toggleBookmark(itemId, type, name) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to manage bookmarks.");
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
                type, // "station" or "route"
                name,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
            alert(`${type.toUpperCase()} "${name}" bookmarked successfully.`);
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
    }
}


// Display all bookmarks
async function displayBookmarks() {
    console.log("displayBookmarks called");

    const user = firebase.auth().currentUser;
    if (!user) {
        console.warn("User not logged in. Cannot display bookmarks.");
        const container = document.getElementById("bookmarks-go-here");
        if (container) {
            container.innerHTML = "<p>Please log in to view bookmarks.</p>";
        }
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
        console.log("Bookmarks snapshot size:", snapshot.size);

        if (snapshot.empty) {
            console.log("No bookmarks found.");
            container.innerHTML = "<p>No bookmarks found.</p>";
            return;
        }

        snapshot.forEach(async (doc) => {
            const data = doc.data();
            const itemId = doc.id;
            const itemType = data.type || "station"; // Default to "station" if type is missing
            const itemName = data.name || "Unnamed Item";

            const newCard = cardTemplate.content.cloneNode(true);

            // Set header and link
            const titleElement = newCard.querySelector(".bookmark-title");
            if (titleElement) {
                titleElement.textContent = itemName;
            }

            // Set "View" button link
            const viewButton = newCard.querySelector(".view-item");
            if (viewButton) {
                viewButton.href =
                    itemType === "station"
                        ? `station.html?stationId=${itemId}`
                        : `route.html?routeId=${itemId}`;
            }

            // Fetch average safety level and update the gradient bar
            const average = await calculateAverageSafetyLevel(
                itemType === "station" ? "stations" : "routes",
                itemId
            );

            const safetyBar = newCard.querySelector(".safety-bar");
            const averageOverlay = newCard.querySelector(".average-overlay");

            if (safetyBar && averageOverlay) {
                // Update overlay text
                averageOverlay.textContent = average === "N/A" ? "N/A" : average;

                // Set gradient based on average
                if (average !== "N/A" && !isNaN(average)) {
                    const percentage = (average / 5) * 100; // Max safety level is 5
                    safetyBar.style.background = `linear-gradient(90deg, red, yellow ${percentage}%, green)`;

                    // Position the overlay dynamically
                    averageOverlay.style.left = `calc(${percentage}% - 20px)`; // Adjust position to center text
                } else {
                    safetyBar.style.background = "linear-gradient(90deg, red, yellow, green)"; // Full gradient
                    averageOverlay.textContent = "N/A";
                }
            }

            // Fetch last incident
            const lastIncident = await getLastIncidentReportTime(
                itemType === "station" ? "stations" : "routes",
                itemId
            );
            const detailsElement = newCard.querySelector(".bookmark-details");
            if (detailsElement) {
                detailsElement.innerHTML = `<strong>Last Incident:</strong> ${lastIncident}`;
            }

            // Configure Remove Bookmark Button
            const removeButton = newCard.querySelector(".remove-bookmark");
            if (removeButton) {
                removeButton.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await toggleBookmark(itemId, itemType, itemName);
                    displayBookmarks(); // Refresh bookmarks after removal
                });
            }

            container.appendChild(newCard);
        });
    } catch (error) {
        console.error("Error displaying bookmarks:", error);
        container.innerHTML = "<p>Failed to load bookmarks. Please try again later.</p>";
    }
}



// event listener to activate the displayBookmarks function
// NOTE: firebase.auth().currentUser only runs once and isnt a powerful 
// NOTE: enough listener, its good for one-time clicks, etc, so we arent going 
// NOTE: to use currentUser inside a DOMContentLoaded event listener
firebase.auth().onAuthStateChanged((user) => {
    console.log("onAuthStateChanged triggered");
    if (user) {
        console.log("User is logged in:", user.email);
        displayBookmarks();
    } else {
        console.log("User is not logged in.");
        const container = document.getElementById("bookmarks-go-here");
        if (container) {
            container.innerHTML = "<p>Please log in to view bookmarks.</p>";
        }
    }
});
