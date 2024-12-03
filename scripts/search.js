//SEARCH.JS HANDLES THE SEARCH FUNCTION AND DISPLAYING SEARCH RESULTS

console.log("Search script loaded");

// Display search results for stations or routes
async function displaySearchResults(collection, isStation = true) {
    const cardTemplate = isStation
        ? document.getElementById("stationsTemplate")
        : document.getElementById("routesTemplate");
    const container = isStation
        ? document.getElementById("stations-go-here")
        : document.getElementById("routes-go-here");

    if (!cardTemplate || !container) {
        console.error("Card template or container not found.");
        return;
    }

    container.innerHTML = ""; // Clear container

    try {
        const querySnapshot = await db.collection(collection).get();

        if (querySnapshot.empty) {
            console.warn(`No documents found in collection: ${collection}`);
            container.innerHTML = "<p>No results found.</p>";
            return;
        }

        querySnapshot.forEach(async (doc) => {
            const data = doc.data();
            const itemId = doc.id;
            const itemName = isStation ? data.name || "Unnamed Station" : itemId; // For routes, ID is the name.

            const newCard = cardTemplate.content.cloneNode(true);

            // Set header link and text
            const titleElement = newCard.querySelector(isStation ? ".station-title" : ".routes-title");
            if (titleElement) {
                titleElement.textContent = itemName;
                titleElement.href = isStation
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // Set "View" button link
            const viewButton = newCard.querySelector(isStation ? ".view-station" : ".view-routes");
            if (viewButton) {
                viewButton.href = isStation
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // Calculate safety level
            const safetyLevel = await calculateAverageSafetyLevel(collection, itemId);
            const safetyElement = newCard.querySelector(
                isStation ? ".station-safety" : ".routes-safetyLevel"
            );
            if (safetyElement) {
                safetyElement.innerHTML = `<strong>Safety Level:</strong> ${safetyLevel}`;
            }

            // Fetch and display last incident timestamp
            const lastIncident = await getLastIncidentReportTime(collection, itemId);
            const detailsElement = newCard.querySelector(
                isStation ? ".station-details" : ".routes-details"
            );
            if (detailsElement) {
                detailsElement.innerHTML = `<strong>Last Reported Incident:</strong> ${lastIncident}`;
            }

            // Configure Bookmark Button
            const bookmarkButton = newCard.querySelector(
                isStation ? ".station-bookmark-button" : ".routes-bookmark-button"
            );
            if (bookmarkButton) {
                const user = firebase.auth().currentUser;
                if (user) {
                    const isBookmarked = await checkBookmarkStatus(itemId);
                    bookmarkButton.textContent = isBookmarked ? "Remove Bookmark" : "Bookmark";
                    bookmarkButton.addEventListener("click", () =>
                        toggleBookmark(itemId, isStation ? "station" : "route", itemName)
                    );
                } else {
                    bookmarkButton.textContent = "Bookmark";
                    bookmarkButton.disabled = true;
                    bookmarkButton.title = "Log in to use bookmarks";
                }
            }

            container.appendChild(newCard);
        });
    } catch (error) {
        console.error("Error fetching search results:", error);
        container.innerHTML = "<p>Failed to load results. Please try again later.</p>";
    }
}


// Input Filtering
function filterSearchResults(isStation = true) {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase();
    console.log("Search term:", searchTerm); // Debug log

    const cards = document.querySelectorAll(isStation ? ".station-card" : ".route-card");
    console.log("Cards found:", cards.length); // Debug log

    cards.forEach((card) => {
        const title = card.querySelector(
            isStation ? ".station-title" : ".routes-title"
        )?.textContent.toLowerCase();
        console.log("Card title:", title); // Debug log

        card.style.display = title?.includes(searchTerm) ? "block" : "none";
    });
}


// Event Listener for Filtering
document.getElementById("searchInput")?.addEventListener("input", () => {
    const isStation = window.location.pathname.includes("station"); // Checks if the current page is a station search
    console.log("Filtering for:", isStation ? "Stations" : "Routes"); // Debug log
    filterSearchResults(isStation);
});


// Load Search Results on Page Load
document.addEventListener("DOMContentLoaded", () => {
    const isStation = window.location.pathname.includes("station");
    displaySearchResults(isStation ? "stations" : "routes", isStation);
});
