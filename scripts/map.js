async function showMap() {
    //------------------------------------------
    // Defines and initiates basic Mapbox data
    //------------------------------------------
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGF5ZG9uZyIsImEiOiJjbTN1bzc5cGUwbTZjMmtvbWJtNDJxZXFwIn0.IU9Ifa-g_8dvQo3wAXAiJQ'; // Add your Mapbox access token here
    const map = new mapboxgl.Map({
        container: 'map', // Container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Styling URL
        center: [-122.964274, 49.236082], // Starting position
        zoom: 8.8 // Starting zoom
    });

    // Add user controls to map (compass and zoom) to top left
    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-left');

    //--------------------------------------
    // Initialize variables for user and search locations
    //--------------------------------------
    let userLocationMarker;
    let searchLocationMarker;
    let userLocation;
    let searchLocation;

    //--------------------------------------
    // Get User Location
    //--------------------------------------
    navigator.geolocation.getCurrentPosition(
        function (position) {
            userLocation = [position.coords.longitude, position.coords.latitude];
            console.log("User Location:", userLocation);

            // Add a marker to the map at the user's location
            userLocationMarker = new mapboxgl.Marker({ color: 'blue' })
                .setLngLat(userLocation)
                .addTo(map);

            // Center the map on the user's location
            map.flyTo({
                center: userLocation
            });

            // Add user's location as a custom pin
            addUserPinCircle(map, userLocation);
        },
        function (error) {
            console.error("Error getting user location:", error);
            alert("Unable to retrieve your location. Please ensure location services are enabled.");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );

    //--------------------------------------
    // Load Custom Data for Geocoder
    //--------------------------------------
    const customData = await loadCustomData(); // Ensure data is loaded before proceeding

    function customGeocoder(query) {
        const matchingFeatures = [];
        for (const feature of customData.features) {
            if (feature.properties.title.toLowerCase().includes(query.toLowerCase())) {
                feature['place_name'] = `🚉 ${feature.properties.title}`; // Station emoji
                feature['center'] = feature.geometry.coordinates;
                feature['place_type'] = ['station'];
                console.log("Custom Feature Added:", feature); // Debug log
                matchingFeatures.push(feature);
            }
        }
        return matchingFeatures;
    }
    

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: customGeocoder, 
        localGeocoderOnly: true, // Ensure only local geocoding is used
        placeholder: 'Search for a STATION', 
        mapboxgl: mapboxgl
    });
    map.addControl(geocoder);
    

    //--------------------------------------
    // Handle Search Results
    //--------------------------------------
    geocoder.on('result', function (e) {
        searchLocation = e.result.geometry.coordinates;
        console.log("Search Location:", searchLocation);

        // Add a marker at the search location
        if (searchLocationMarker) searchLocationMarker.remove(); // Remove previous marker
        searchLocationMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat(searchLocation)
            .addTo(map);

        // Fit map bounds to include user and search locations
        const bounds = new mapboxgl.LngLatBounds();
        if (userLocation) bounds.extend(userLocation);
        bounds.extend(searchLocation);

        map.fitBounds(bounds, { padding: { top: 100, bottom: 50, left: 100, right: 50 } });
    });

    //---------------------------------
    // Add Pins for Stations
    //---------------------------------
    addHikePinsCircle(map);
}

showMap();



function addHikePinsCircle(map) {
    db.collection('stations-test4').get().then(allEvents => {
        const features = [];

        allEvents.forEach(doc => {
            const data = doc.data();

            if (data.lat && data.lng) {
                const coordinates = [data.lng, data.lat];
                const stationName = data.name || "Unnamed Station"; // Default name
                const stationId = doc.id; // Get the document ID for reference

                features.push({
                    'type': 'Feature',
                    'properties': {
                        'description': `<strong>${stationName}</strong>`,
                        'stationId': stationId // Include station ID for actions
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': coordinates
                    }
                });
            } else {
                console.warn(`Document ${doc.id} is missing lat/lng`);
            }
        });

        if (features.length > 0) {
            map.addSource('places', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': features
                }
            });

            map.addLayer({
                'id': 'places',
                'type': 'circle',
                'source': 'places',
                'paint': {
                    'circle-color': '#4264fb',
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });

            // Add click event listener for the circles
            map.on('click', 'places', async (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const stationName = e.features[0].properties.description;
                const stationId = e.features[0].properties.stationId;

                // Calculate the average safety level dynamically
                const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);

                // Create popup content with buttons
                const popupContent = `
                    <div style="font-size: 14px;">
                        <p>${stationName}</p>
                        <p>Average Safety Level: ${averageSafetyLevel}</p>
                        <button 
                            onclick="viewStation('${stationId}')" 
                            style="margin: 5px; padding: 5px; background-color: #007bff; color: white; border: none; cursor: pointer;">
                            View Station
                        </button>
                        <button 
                            onclick="displaySafetyLevel('${stationId}')" 
                            style="margin: 5px; padding: 5px; background-color: #28a745; color: white; border: none; cursor: pointer;">
                            Check Safety Level
                        </button>
                    </div>
                `;

                // Display the popup
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);
            });

            map.on('mouseenter', 'places', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'places', () => {
                map.getCanvas().style.cursor = '';
            });
        } else {
            console.warn("No valid features to display on the map.");
        }
    }).catch(error => {
        console.error("Error fetching data from Firestore:", error);
    });
}

function viewStation(stationId) {
    // Replace with the actual path to your station details page
    window.location.href = `station.html?stationId=${stationId}`;
}

// Attach the function to the global scope
window.viewStation = viewStation;


async function displaySafetyLevel(stationId) {
    const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);
    console.log("stationAverageLoaded");
    alert(`Average Safety Level for Station ${stationId}: ${averageSafetyLevel}`);
}

// Attach to the global scope
window.displaySafetyLevel = displaySafetyLevel;



function addUserPinCircle(map, userLocation) {
    map.addSource('userLocation', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: userLocation
                },
                properties: { description: 'Your Location' }
            }]
        }
    });

    map.addLayer({
        id: 'userLocation',
        type: 'circle',
        source: 'userLocation',
        paint: {
            'circle-color': '#4264fb',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
    });
}




async function loadCustomData() {
    const customData = { features: [], type: 'FeatureCollection' };
    try {
        const querySnapshot = await db.collection('stations-test').get();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.lat && data.lng && data.name) { // Validate required fields
                customData.features.push({
                    type: 'Feature',
                    properties: { title: data.name },
                    geometry: {
                        type: 'Point',
                        coordinates: [data.lng, data.lat]
                    }
                });
            }
        });
        console.log("Custom Data Loaded:", customData);
    } catch (error) {
        console.error("Error loading custom data:", error);
    }
    return customData;
}


// function customGeocoder(query) {
//     const matchingFeatures = [];
//     for (const feature of customData.features) {
//         if (feature.properties.title.toLowerCase().includes(query.toLowerCase())) {
//             feature['place_name'] = `🚉 ${feature.properties.title}`; // Use station emoji 🚉
//             feature['center'] = feature.geometry.coordinates;
//             feature['place_type'] = ['station']; // Optional: Label as a station
//             matchingFeatures.push(feature);
//         }
//     }
//     return matchingFeatures;
// }

