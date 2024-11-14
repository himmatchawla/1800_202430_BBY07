    const userId = user.uid;
    const userRef = db.collection("users").doc(userId);
    const recentlyViewedRef = userRef.collection("recentlyViewed");

    try {
        // Check if the station already exists in recently viewed
        const existingDocs = await recentlyViewedRef.where("stationId", "==", stationId).get();

        if (!existingDocs.empty) {
            // If the station already exists, update its timestamp to mark it as most recent
            const existingDoc = existingDocs.docs[0];
            await recentlyViewedRef.doc(existingDoc.id).update({
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Otherwise, add the station with a timestamp
            await recentlyViewedRef.add({
                stationId: stationId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Ensure only the 5 most recent stations are kept
        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").get();
        const docs = snapshot.docs;

        if (docs.length > 5) {
            // Delete oldest entries beyond the 5 most recent
            const excessDocs = docs.slice(5);
            for (let doc of excessDocs) {
                await recentlyViewedRef.doc(doc.id).delete();
            }
        }

    } catch (error) {
        console.error("Error updating recently viewed stations:", error);
    }


// Function to retrieve and display recently viewed stations on main.html
async function displayRecentlyViewedStations() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No user is logged in.");
        return;
    }

    const userId = user.uid;
    const recentlyViewedRef = db.collection("users").doc(userId).collection("recentlyViewed");

    try {
        // Get the 5 most recent stations in order
        const snapshot = await recentlyViewedRef.orderBy("timestamp", "desc").limit(5).get();
        const recentlyViewedContainer = document.getElementById("recentlyViewedContainer");
        recentlyViewedContainer.innerHTML = ""; // Clear any previous data

        snapshot.forEach(doc => {
            const stationId = doc.data().stationId;
            const stationElement = document.createElement("div");
            stationElement.classList.add("recent-station");
            stationElement.textContent = `Station: ${stationId}`;
            
            // Optionally make the station clickable to view it again
            stationElement.onclick = () => {
                window.location.href = `station.html?stationId=${stationId}`;
            };

            recentlyViewedContainer.appendChild(stationElement);
        });
    } catch (error) {
        console.error("Error displaying recently viewed stations:", error);
    }
}

// Check if on station.html and add station to recently viewed if applicable
if (window.location.pathname.includes("station.html")) {
    document.addEventListener("DOMContentLoaded", () => {
        const stationId = getStationIdFromURL();
        if (stationId) {
            addToRecentlyViewed(stationId);
        }
    });
}

// Automatically display recently viewed stations on main.html
if (window.location.pathname.includes("main.html")) {
    document.addEventListener("DOMContentLoaded", displayRecentlyViewedStations);
}

// Helper function to get the station ID from the URL
function getStationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("stationId");
}
