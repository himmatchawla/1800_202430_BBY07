console.log("Bookmarks script loaded");

// Listen for authentication state changes
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        const stationId = getStationIdFromURL();
        if (stationId) {
            checkBookmarkStatus(stationId); // Check and set the bookmark status
        }

        // Add event listener to the bookmark button
        const bookmarkButton = document.getElementById("bookmarkButton");
        if (bookmarkButton) {
            bookmarkButton.addEventListener("click", () => {
                const name = document.getElementById("stationName")?.textContent;
                bookmarkCurrentItem(stationId, "station", name);
            });
        }
    } else {
        console.log("User not logged in.");
        const bookmarkMessage = document.getElementById("bookmarkMessage");
        if (bookmarkMessage) {
            bookmarkMessage.textContent = "Please log in to use bookmarks.";
            bookmarkMessage.style.color = "red";
        }
    }
});

// Bookmark the current item
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
        await bookmarkRef.set({
            type: type, // "station" or "route"
            name: name, // The name of the station or route
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("bookmarkMessage").textContent = `${type.toUpperCase()} "${name}" bookmarked successfully!`;
        document.getElementById("bookmarkMessage").style.color = "green";

        checkBookmarkStatus(itemId); // Update the button state
    } catch (error) {
        console.error(`Error bookmarking ${type}:`, error);
        document.getElementById("bookmarkMessage").textContent = "Failed to bookmark.";
        document.getElementById("bookmarkMessage").style.color = "red";
    }
}

// Unbookmark the current item
async function unbookmarkCurrentItem(itemId) {
    console.log("Unbookmarking:", itemId);

    const user = firebase.auth().currentUser;
    if (!user) {
        document.getElementById("bookmarkMessage").textContent = "Please log in to unbookmark items.";
        document.getElementById("bookmarkMessage").style.color = "red";
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        await bookmarkRef.delete();

        document.getElementById("bookmarkMessage").textContent = "Bookmark removed successfully!";
        document.getElementById("bookmarkMessage").style.color = "green";

        checkBookmarkStatus(itemId); // Update the button state
    } catch (error) {
        console.error("Error removing bookmark:", error);
        document.getElementById("bookmarkMessage").textContent = "Failed to remove bookmark.";
        document.getElementById("bookmarkMessage").style.color = "red";
    }
}

// Check if the current item is bookmarked and update the button
async function checkBookmarkStatus(itemId) {
    console.log("Checking bookmark status for:", itemId);

    const user = firebase.auth().currentUser;

    if (!user) {
        console.error("User not logged in.");
        return;
    }

    const userId = user.uid;
    const bookmarkRef = db.collection("users").doc(userId).collection("bookmarks").doc(itemId);

    try {
        const doc = await bookmarkRef.get();

        const bookmarkButton = document.getElementById("bookmarkButton");
        if (!bookmarkButton) {
            console.error("Bookmark button not found.");
            return;
        }

        if (doc.exists) {
            console.log("Item is bookmarked:", itemId);
            bookmarkButton.textContent = "Remove Bookmark";
            bookmarkButton.onclick = () => unbookmarkCurrentItem(itemId);
        } else {
            console.log("Item is not bookmarked:", itemId);
            const name = document.getElementById("stationName")?.textContent;
            bookmarkButton.textContent = "Bookmark";
            bookmarkButton.onclick = () => bookmarkCurrentItem(itemId, "station", name);
        }
    } catch (error) {
        console.error("Error checking bookmark status:", error);
    }
}
