//SEARCH.JS HANDLES THE SEARCH FUNCTION AND DISPLAYING SEARCH RESULTS

console.log("Search script loaded");

// display search results for stations or routes
async function displaySearchResults(collection, isStation = true) {
    const cardTemplate = isStation
        ? document.getElementById("stationsTemplate")
        : document.getElementById("routesTemplate");
    const container = isStation
        ? document.getElementById("stations-go-here")
        : document.getElementById("routes-go-here");

    if (!cardTemplate || !container) { // cannot display if the template or container IDs are not found
        console.error("Card template or container not found.");
        return;
    }

    container.innerHTML = ""; // clear container

    try { // try block for error handling
        const querySnapshot = await db.collection(collection).get();

        if (querySnapshot.empty) { // error handling - if no documents are found in the collection
            console.warn(`No documents found in collection: ${collection}`);
            container.innerHTML = "<p>No results found.</p>";
            return;
        }

        querySnapshot.forEach(async (doc) => { // display search results
            const data = doc.data();
            const itemId = doc.id;
            const itemName = isStation ? data.name || "Unnamed Station" : itemId; // For routes, ID is the name.

            const newCard = cardTemplate.content.cloneNode(true);

            // set header
            const titleElement = newCard.querySelector(isStation ? ".station-title" : ".routes-title");
            if (titleElement) {
                titleElement.textContent = itemName;
                titleElement.href = isStation
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // aet "View" button link
            const viewButton = newCard.querySelector(isStation ? ".view-station" : ".view-routes");
            if (viewButton) {
                viewButton.href = isStation
                    ? `station.html?stationId=${itemId}`
                    : `route.html?routeId=${itemId}`;
            }

            // calculate safety level
            const safetyLevel = await calculateAverageSafetyLevel(collection, itemId);
            const safetyElement = newCard.querySelector(
                isStation ? ".station-safety" : ".routes-safetyLevel"
            );
            if (safetyElement) {
                safetyElement.innerHTML = `<strong>Safety Level:</strong> ${safetyLevel}`;
            }

            // display last incident timestamp
            const lastIncident = await getLastIncidentReportTime(collection, itemId);
            const detailsElement = newCard.querySelector(
                isStation ? ".station-details" : ".routes-details"
            );
            if (detailsElement) {
                detailsElement.innerHTML = `<strong>Last Reported Incident:</strong> ${lastIncident}`;
            }

            // configure "Bookmark" Button
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
    } catch (error) { // error handling
        console.error("Error fetching search results:", error);
        container.innerHTML = "<p>Failed to load results. Please try again later.</p>";
    }
}


// input Filtering
function filterSearchResults(isStation = true) {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase();
    console.log("Search term:", searchTerm); // error logging

    const cards = document.querySelectorAll(isStation ? ".station-card" : ".route-card");
    console.log("Cards found:", cards.length); // error logging

    cards.forEach((card) => {
        const title = card.querySelector(
            isStation ? ".station-title" : ".routes-title"
        )?.textContent.toLowerCase();
        console.log("Card title:", title); // error logging

        card.style.display = title?.includes(searchTerm) ? "block" : "none";
    });
}


// event listener for Filtering
document.getElementById("searchInput")?.addEventListener("input", () => {
    const isStation = window.location.pathname.includes("station");
    console.log("Filtering for:", isStation ? "Stations" : "Routes");
    filterSearchResults(isStation);
});


// load search results on Page Load
document.addEventListener("DOMContentLoaded", () => {
    const isStation = window.location.pathname.includes("station");
    displaySearchResults(isStation ? "stations" : "routes", isStation);
});
