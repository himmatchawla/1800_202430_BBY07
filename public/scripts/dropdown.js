const firebaseConfig = {
    apiKey: "AIzaSyDr1vA3wOtKq01WABZTtnjKeUOn-Yc17ko",
    authDomain: "transitaura.firebaseapp.com",
    projectId: "transitaura",
    storageBucket: "transitaura.firebasestorage.app",
    messagingSenderId: "522264051253",
    appId: "1:522264051253:web:e4ec773e80453c7b52bb7c",
    measurementId: "G-FD02KS68HH"
  };

// prevent double firebase instance init (very bad)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore(); // Firestore instance

// fetch station names from firestore and populate dropdown
async function populateDropdown() {
    const dropdownOptions = document.getElementById('dropdownOptionsStations');
    dropdownOptions.innerHTML = '';

    try {
        const stationsSnapshot = await db.collection('stations').get();
        stationsSnapshot.forEach(doc => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            option.textContent = doc.id;
            option.onclick = () => selectOption(doc.id);
            dropdownOptions.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching station names:', error);
    }
}

// filter dropdown options based on input
function filterOptions() {
    const input = document.getElementById('dropdownInputStations').value.toLowerCase();
    const options = document.getElementsByClassName('dropdown-option');
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.textContent.toLowerCase().includes(input)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    }
}

// toggle dropdown visibility
function toggleDropdown() {
    const dropdownOptions = document.getElementById('dropdownOptionsStations');
    dropdownOptions.classList.toggle('show');
}

// handle option selection
function selectOption(stationId) {
    window.location.href = `/station/${stationId}`; // Redirect to dynamic station page
}

// load stations when page loads
window.onload = populateDropdown;
