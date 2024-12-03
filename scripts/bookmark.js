console.log("Bookmarks script loaded");

// bookmark an item (station or route)
async function toggleBookmark(itemId, type, name) {
    const user = firebase.auth().currentUser;
    if (!user) {
        swal("Please log in.", "You must be logged in to bookmark items.", "error");
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        const doc = await bookmarkRef.get();
        if (doc.exists) {
            await bookmarkRef.delete();
            swal("Removed from Bookmarks!", `${name} has been removed from bookmarks.`, "success");
        } else {
            await bookmarkRef.set({
                type, // "station" or "route"
                name,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
            swal("Added to Bookmarks!", `${name} has been added to bookmarks.`, "success");
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
    }
}

// display bookmarks (on main.html)
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

// bookmark icon functionality (on station.html and route.html)
async function handleBookmarkIcon(isInitialization = false) {
    const stationId = getStationIdFromURL();
    const routeId = getRouteIdFromURL();
    const itemId = stationId || routeId;
    const itemType = stationId ? "station" : "route";

    if (!itemId) {
        console.warn("No station or route ID found in the URL.");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        if (!isInitialization) {
            swal("Please log in.", "You must be logged in to bookmark items.", "error");
        }
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);
    const icon = document.getElementById("bookmarkIcon");

    try {
        const doc = await bookmarkRef.get();

        if (isInitialization) {
            // During initialization, only update the icon state
            if (icon) {
                icon.src = doc.exists ? "media/bookmark-filled.png" : "media/bookmark-unfilled.png";
            }
        } else {
            // On user click, toggle the bookmark and update the icon
            const nameElement = document.getElementById(stationId ? "stationName" : "routeName");
            const name = nameElement ? nameElement.textContent.trim() : "Unnamed Item";

            if (doc.exists) {
                await bookmarkRef.delete();
                if (icon) icon.src = "media/bookmark-unfilled.png";
                swal("Removed from Bookmarks!", `${name} has been removed from bookmarks.`, "success");
            } else {
                await bookmarkRef.set({
                    type: itemType,
                    name,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });
                if (icon) icon.src = "media/bookmark-filled.png";
                swal("Added to Bookmarks!", `${name} has been added to bookmarks.`, "success");
            }
        }
    } catch (error) {
        console.error("Error handling bookmark icon:", error);
    }
}


// event listener to activate the displayBookmarks function and handle the bookmark icon
firebase.auth().onAuthStateChanged((user) => {
    console.log("onAuthStateChanged triggered");
    const icon = document.getElementById("bookmarkIcon");

    if (user) {
        console.log("User is logged in:", user.email);
        displayBookmarks();

        // Initialize the bookmark icon functionality if it exists
        if (icon) {
            // Set up the click event
            icon.addEventListener("click", () => handleBookmarkIcon(false));

            // Initialize the icon's state
            handleBookmarkIcon(true); // Pass `true` to indicate initialization
        }
    } else {
        console.log("User is not logged in.");
        const container = document.getElementById("bookmarks-go-here");
        if (container) {
            container.innerHTML = "<p>Please log in to view bookmarks.</p>";
        }

        // Optionally reset the bookmark icon for unauthenticated users
        if (icon) {
            icon.src = "media/bookmark-unfilled.png";
        }
    }
});
