// DROPDOWN.JS RUNS THE DROPDOWNS ON SEARCHSTATIONS.HTML/SEARCHROUTES.HTML AND REDIRECTS TO STATION.HTML TEMPLATE WITH THE DOCUMENT ID (AKA STATIONID/ROUTEID)

// firebase init
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// populate dropdown with stations or routes
async function populateDropdown() {
    const isStationSearch = window.location.pathname.includes('searchstations.html');
    const collectionName = isStationSearch ? 'stations' : 'routes';
    const dropdownOptions = document.getElementById(
        isStationSearch ? 'dropdownOptionsStations' : 'dropdownOptionsRoutes'
    );
    dropdownOptions.innerHTML = ''; // clear existing options

    try {
        const snapshot = await db.collection(collectionName).get(); // fetch stations/routes from firestore
        snapshot.forEach(doc => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = doc.data().name || doc.id;

            // clicking an option links to station.html or route.html with the respective ID
            option.onclick = () => {
                const page = isStationSearch ? 'station.html' : 'route.html';
                window.location.href = `${page}?${isStationSearch ? 'stationId' : 'routeId'}=${doc.id}`;
            };
            dropdownOptions.appendChild(option);
        });
    } catch (error) {
        console.error(`Error fetching ${isStationSearch ? 'station' : 'route'} names:`, error);
    }
}

// filter dropdown options based on user input
function filterOptions() {
    const isStationSearch = window.location.pathname.includes('searchstations.html');
    const input = document.getElementById(isStationSearch ? 'dropdownInputStations' : 'dropdownInputRoutes').value.toLowerCase();
    const options = document.querySelectorAll('.dropdown-option');

    options.forEach(option => {
        const optionText = option.textContent.toLowerCase();
        option.style.display = optionText.includes(input) ? '' : 'none';
    });
}

// toggle dropdown display
function toggleDropdown() {
    const isStationSearch = window.location.pathname.includes('searchstations.html');
    const dropdownOptions = document.getElementById(
        isStationSearch ? 'dropdownOptionsStations' : 'dropdownOptionsRoutes'
    );
    dropdownOptions.classList.toggle('show');
}

// load dropdown when page loads
document.addEventListener('DOMContentLoaded', populateDropdown);
