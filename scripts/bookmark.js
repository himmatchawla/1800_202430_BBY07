//BOOKMARK.JS HANDLES BOOKMARKING BUTTONS AND DISPLAYING THEM ON MAIN.HTML

// error logging
console.log("Bookmarks script loaded");

// bookmark an item (station or route)
async function toggleBookmark(itemId, type, name) {
    const user = firebase.auth().currentUser;
    if (!user) { // user cannot bookmark if not logged in
        swal("Please log in.", "You must be logged in to bookmark items.", "error");
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try { // try block for error handling
        const doc = await bookmarkRef.get();
        if (doc.exists) { // if bookmark exists, delete it
            await bookmarkRef.delete();
            swal("Removed from Bookmarks!", `${name} has been removed from bookmarks.`, "success");
        } else {
            await bookmarkRef.set({ // if bookmark does not exist, add it
                type, 
                name,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
            swal("Added to Bookmarks!", `${name} has been added to bookmarks.`, "success");
        }
    } catch (error) { // error handling
        console.error("Error toggling bookmark:", error);
    }
}

// display bookmarks (on main.html)
async function displayBookmarks() {
    console.log("displayBookmarks called");

    const user = firebase.auth().currentUser;
    if (!user) { // user cannot view bookmarks if not logged in
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

    if (!cardTemplate || !container) { // cannot display if the template or container IDs are not found
        console.error("Card template or container not found.");
        return;
    }

    container.innerHTML = ""; // clear container

    try { // try block for error handling
        const snapshot = await bookmarksRef.get(); // get bookmarks from bookmarks subcollection
        console.log("Bookmarks snapshot size:", snapshot.size)

        if (snapshot.empty) { // if no bookmarks found, display message
            console.log("No bookmarks found.");
            container.innerHTML = "<p>No bookmarks found.</p>";
            return;
        }

        snapshot.forEach(async (doc) => { // for each bookmark, display the bookmark card
            const data = doc.data();
            const itemId = doc.id;
            const itemType = data.type || "station"; // default to "station" if type is missing just in case
            const itemName = data.name || "Unnamed Item";

            const newCard = cardTemplate.content.cloneNode(true);

            // set header
            const titleElement = newCard.querySelector(".bookmark-title");
            if (titleElement) {
                titleElement.textContent = itemName;
            }

            // set "View" button link
            const viewButton = newCard.querySelector(".view-item");
            if (viewButton) {
                viewButton.href =
                    itemType === "station"
                        ? `station.html?stationId=${itemId}`
                        : `route.html?routeId=${itemId}`;
            }

            // get average safety level and update the gradient bar
            const average = await calculateAverageSafetyLevel(
                itemType === "station" ? "stations" : "routes",
                itemId
            );

            const safetyBar = newCard.querySelector(".safety-bar");
            const averageOverlay = newCard.querySelector(".average-overlay");

            if (safetyBar && averageOverlay) {
                // update overlay text
                averageOverlay.textContent = average === "N/A" ? "N/A" : average;

                // set gradient based on average
                if (average !== "N/A" && !isNaN(average)) {
                    const percentage = (average / 5) * 100; // max safety level is 5
                    safetyBar.style.background = `linear-gradient(90deg, red, yellow ${percentage}%, green)`;

                    // position the overlay dynamically
                    averageOverlay.style.left = `calc(${percentage}% - 20px)`; // adjust position to center text
                } else {
                    safetyBar.style.background = "linear-gradient(90deg, red, yellow, green)"; // full gradient red to green
                    averageOverlay.textContent = "N/A";
                }
            }

            // get last incident
            const lastIncident = await getLastIncidentReportTime(
                itemType === "station" ? "stations" : "routes",
                itemId
            );
            const detailsElement = newCard.querySelector(".bookmark-details");
            if (detailsElement) {
                detailsElement.innerHTML = `<strong>Last Incident:</strong> ${lastIncident}`;
            }

            // "remove bookmark" Button
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
    } catch (error) { // error handling
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

    if (!itemId) { // if no station or route ID found in the URL
        console.warn("No station or route ID found in the URL.");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) { // user cannot bookmark if not logged in
        if (!isInitialization) {
            swal("Please log in.", "You must be logged in to bookmark items.", "error");
        }
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);
    const icon = document.getElementById("bookmarkIcon");

    try { // try block for error handling
        const doc = await bookmarkRef.get();

        if (isInitialization) {
            // update the icon's pre-existing state
            if (icon) {
                icon.src = doc.exists ? "media/bookmark-filled.png" : "media/bookmark-unfilled.png";
            }
        } else {
            // on user click, toggle bookmark and update  icon
            const nameElement = document.getElementById(stationId ? "stationName" : "routeName");
            const name = nameElement ? nameElement.textContent.trim() : "Unnamed Item";

            if (doc.exists) { // if bookmark exists, delete it
                await bookmarkRef.delete();
                if (icon) icon.src = "media/bookmark-unfilled.png";
                swal("Removed from Bookmarks!", `${name} has been removed from bookmarks.`, "success");
            } else { // if bookmark does not exist, add it
                await bookmarkRef.set({
                    type: itemType,
                    name,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });
                if (icon) icon.src = "media/bookmark-filled.png";
                swal("Added to Bookmarks!", `${name} has been added to bookmarks.`, "success");
            }
        }
    } catch (error) { // error handling
        console.error("Error handling bookmark icon:", error);
    }
}



// event listener to activate the displayBookmarks and handleBookmarkIcon functions and handle the bookmark icon
// NOTE: we will use onAuthStateChanged instead of DOMContentLoaded because the user must be authenticated PRIOR to loading bookmarks
// usually, DOMContentLoaded is enough because most of our interactions are click-based
firebase.auth().onAuthStateChanged((user) => {
    console.log("onAuthStateChanged triggered");
    const icon = document.getElementById("bookmarkIcon");

    if (user) { // if user is logged in, display bookmarks
        console.log("User is logged in:", user.email);
        displayBookmarks();

        // initialize the bookmark icon functionality (if it exists, so basically if we are on station.html or route.html)
        if (icon) {
            icon.addEventListener("click", () => handleBookmarkIcon(false));
            handleBookmarkIcon(true); 
        }
    } else { // if user is not logged in, display message
        console.log("User is not logged in.");
        const container = document.getElementById("bookmarks-go-here");
        if (container) {
            container.innerHTML = "<p>Please log in to view bookmarks.</p>";
        }
        // reset the bookmark icon for unauthenticated users
        if (icon) {
            icon.src = "media/bookmark-unfilled.png";
        }
    }
});
