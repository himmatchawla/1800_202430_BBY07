//RECENTLYVIEWED.JS HANDLES RECENTLY VIEWED FUNCTIONALITY AND DISPLAYING THEM IN THE RECENTLY VIEWED CONTAINER ON MAIN.HTML

// firebase init
if (!firebase.apps.length) {
    console.error("Firebase is not initialized. Check if firebaseConfig.js is loaded before recentlyviewed.js.");
}

// add station or route to the recently viewed list
async function addToRecentlyViewed(itemId, type) {
    const user = firebase.auth().currentUser;

    if (!user) { // user cannot view recently viewed items if not logged in
        console.error("No user is logged in."); // error logging
        return;
    }

    const userId = user.uid;
    const userRef = db.collection("users").doc(userId);
    const recentlyViewedRef = userRef.collection("recentlyViewed");

    try { // try block for error handling
        const existingDocs = await recentlyViewedRef
            .where("itemId", "==", itemId)
            .where("type", "==", type)
            .get();

        if (!existingDocs.empty) { // update timestamp if item already exists
            const existingDoc = existingDocs.docs[0];
            await recentlyViewedRef.doc(existingDoc.id).update({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } else { // add new item to recently viewed
            await recentlyViewedRef.add({
                itemId: itemId,
                type: type,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }

        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").get();
        const docs = snapshot.docs;

        if (docs.length > 5) { // limit recently viewed items to 5
            const excessDocs = docs.slice(5);
            for (const doc of excessDocs) {
                await recentlyViewedRef.doc(doc.id).delete();
            }
        }
    } catch (error) { // error handling
        console.error("Error updating recently viewed items:", error); // error logging
    }
}

// retrieve and display recently viewed
async function displayRecentlyViewedItems() {
    const user = firebase.auth().currentUser;

    if (!user) { // user cannot view recently viewed items if not logged in
        console.error("No user is logged in."); // error logging
        const container = document.getElementById("recentlyViewedContainer");
        container.innerHTML = `
            <h2>Recently Viewed</h2>
            <p>Please log in to see recently viewed items.</p>
        `;
        return;
    }

    const userId = user.uid;
    const recentlyViewedRef = db.collection("users").doc(userId).collection("recentlyViewed");

    try { // try block for error handling
        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").limit(5).get();
        const container = document.getElementById("recentlyViewedContainer");

        container.innerHTML = "<h2>Recently Viewed</h2>";

        if (snapshot.empty) { // if no recently viewed items found, display message
            container.innerHTML += `<p>No recently viewed items.</p>`;
            return;
        }

        snapshot.forEach((doc) => { // for each recently viewed item, display the item
            const data = doc.data();
            const itemElement = document.createElement("div");
            itemElement.classList.add("recent-item");

            // append "Station" to station names (since we used document ID (stationId) and not the name field)
            const displayName = data.type === "station" ? `${data.itemId} Station` : data.itemId;

            const link = // link to station or route page
                data.type === "station"
                    ? `station.html?stationId=${data.itemId}`
                    : `route.html?routeId=${data.itemId}`;

            itemElement.innerHTML = `
                <a href="${link}" class="recently-viewed-link">
                    <div class="recently-viewed-item">
                        <div class="recently-viewed-content">
                            <p>${displayName}</p>
                        </div>
                    </div>
                </a>
            `;

            container.appendChild(itemElement);
        });
    } catch (error) { // error handling
        console.error("Error displaying recently viewed items:", error); // error logging
    }
}


// extract station or route IDs from the URL
function getStationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("stationId");
}

function getRouteIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("routeId");
}


// event listener to activate the displayBookmarks and handleBookmarkIcon functions and handle the bookmark icon
// NOTE: we will use onAuthStateChanged instead of DOMContentLoaded because the user must be authenticated PRIOR to loading bookmarks
// usually, DOMContentLoaded is enough because most of our interactions are click-based
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const pathname = window.location.pathname;

        if (pathname.includes("station.html")) {
            const stationId = getStationIdFromURL();
            if (stationId) addToRecentlyViewed(stationId, "station");
        } else if (pathname.includes("route.html")) {
            const routeId = getRouteIdFromURL();
            if (routeId) addToRecentlyViewed(routeId, "route");
        } else if (pathname.includes("main.html")) {
            displayRecentlyViewedItems();
        }
    } else {
        console.error("No user is logged in."); // error logging
    }
});
