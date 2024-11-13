// initialize firebase info
const firebaseConfig = {
    apiKey: "AIzaSyDr1vA3wOtKq01WABZTtnjKeUOn-Yc17ko",
    authDomain: "transitaura.firebaseapp.com",
    projectId: "transitaura",
    storageBucket: "transitaura.firebasestorage.app",
    messagingSenderId: "522264051253",
    appId: "1:522264051253:web:e4ec773e80453c7b52bb7c",
    measurementId: "G-FD02KS68HH"
  };

// new firebase instance if one doesnt already exist
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// set db const as firestore db
const db = firebase.firestore();

// populate dropdown w station options
async function populateDropdown() {
    const dropdownOptions = document.getElementById('dropdownOptionsStations');
    dropdownOptions.innerHTML = ''; // clear existing options

    try {
        const stationsSnapshot = await db.collection('stations').get(); // pull station options from firestore
        stationsSnapshot.forEach(doc => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = doc.data().name || doc.id; // display the station name or ID (document names in "stations" collection)

            // click event - an option links to station.html + station ID of the clicked station
            option.onclick = () => {
                window.location.href = `station.html?stationId=${doc.id}`;
            };
            dropdownOptions.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching station names:', error);
    }
}

// filter dropdown options based on user input
function filterOptions() {
    const input = document.getElementById('dropdownInputStations').value.toLowerCase();
    const options = document.querySelectorAll('.dropdown-option');

    options.forEach(option => {
        const optionText = option.textContent.toLowerCase();
        option.style.display = optionText.includes(input) ? '' : 'none';
    });
}

// toggle dropdown display
function toggleDropdown() {
    const dropdownOptions = document.getElementById('dropdownOptionsStations');
    dropdownOptions.classList.toggle('show');
}

// load the dropdown when page loads
document.addEventListener('DOMContentLoaded', populateDropdown);
