//MAP.JS HANDLES THE MAP DISPLAY

/*Function used to display the mapbox. Sorry if the code is long, but I got this code from Carly's notion.
*/ 

async function showMap() {
    
    //------------------------------------------
    // Defines and initiates basic Mapbox data
    //------------------------------------------
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGF5ZG9uZyIsImEiOiJjbTN1bzc5cGUwbTZjMmtvbWJtNDJxZXFwIn0.IU9Ifa-g_8dvQo3wAXAiJQ'; 
    // We know we pushed our access token but didn't want to hide this whole file
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


    // Adding Pins for Stations
    addStationPinsCircle(map);
}

showMap();

//Function used to calculate the safety level. Will be used by displaySafetyLevel function to display the safey leve. on the map.
function calculateSafetyLevelGradientColor(level) {
    if (level === "N/A" || isNaN(level)) return "#ccc"; // Grey for N/A
    const percentage = level / 5; // Scale safety level (max is 5)
    const r = Math.round((1 - percentage) * 255); // Red decreases as level increases
    const g = Math.round(percentage * 255); // Green increases as level increases
    return `rgb(${r},${g},0)`; // Dynamic gradient color
}


//How stations are displayed as points on the map. Sorry if the code is long, this function is from Carly's Notion.
function addStationPinsCircle(map) {
    db.collection('stations-test4').get().then(allEvents => {
        const features = [];

        allEvents.forEach(doc => {
            const data = doc.data();

            // Check if the document contains latitude and longitude data
            if (data.lat && data.lng) {
                const coordinates = [data.lng, data.lat];
                const stationName = data.name || "Unnamed Station";
                const stationId = doc.id;

                // Push the feature (GeoJSON point) to the features array
                features.push({
                    'type': 'Feature',
                    'properties': {
                        'description': stationName,
                        'stationId': stationId
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': coordinates
                    }
                });
            } else {
                // Log a warning if a document is missing latitude or longitude data
                console.warn(`Document ${doc.id} is missing lat/lng`);
            }
        });

        // If features have been added, display them on the map
        if (features.length > 0) {
            // Add the GeoJSON data as a source to the map
            map.addSource('places', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': features
                }
            });


            // Add a circle layer to display the stations on the map
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

            // Add a click event listener to show station details in a popup
            map.on('click', 'places', async (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const stationName = e.features[0].properties.description;
                const stationId = e.features[0].properties.stationId;

                // Calculate the average safety level for the station
                const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);
                // Calculate the color for the safety level
                const circleColor = calculateSafetyLevelGradientColor(averageSafetyLevel);

                // Create a color-coded circle for the safety level
                const circleHTML = `
                    <div style="
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        background: ${circleColor};
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        border: 2px solid #fff;
                        text-align: center;
                        justify-content: center;
                        margin: 0 auto;
                        margin-top: 5px;
                    ">
                        ${averageSafetyLevel === "N/A" ? "N/A" : averageSafetyLevel}
                    </div>
                `;

                // Update the popup content
                const popupContent = `
                    <div style="font-size: 14px; text-align: center;">
                        
                        <p><strong>${stationName}</strong></p>
                        <p>Safety Level</p>
                        ${circleHTML}
                        <button 
                            onclick="viewStation('${stationId}')" 
                            style="margin: 5px; padding: 5px; background-color: #007bff; color: white; border: none; cursor: pointer; margin: 0 auto; margin-top: 5px;">
                            View Station
                        </button>
                    </div>
                `;

                // Create and display the popup with the station's details
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
            // Log a warning if there are no valid features to display
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

//Function used to display the safety level on the map.
async function displaySafetyLevel(stationId) {
    const averageSafetyLevel = await calculateStationAverageSafetyLevel(stationId);
    console.log("stationAverageLoaded");
    alert(`Average Safety Level for Station ${stationId}: ${averageSafetyLevel}`);
}

// Attach to the global scope
window.displaySafetyLevel = displaySafetyLevel;

/**
 * Code from Carly that gets the location of the user.
 * @param {map} map 
 * @param {userLocation} userLocation 
 */

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


/**
 * Loads custom data from the Firestore `stations-test` collection and formats it as GeoJSON.
 * @returns A GeoJSON object containing the station data with `FeatureCollection` structure.
 */

async function loadCustomData() {
    // Initialize an empty GeoJSON FeatureCollection
    const customData = { features: [], type: 'FeatureCollection' };
    try {
        // Fetch all documents from the `stations-test` Firestore collection
        const querySnapshot = await db.collection('stations-test').get();

        // Iterate through each document in the query snapshot
        querySnapshot.forEach(doc => {
            const data = doc.data();

            // Ensure the document contains the required fields: latitude, longitude, and name
            if (data.lat && data.lng && data.name) { 

                // Add a GeoJSON Feature for the document
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
        // Log the successfully loaded custom data to the console
        console.log("Custom Data Loaded:", customData);
    } catch (error) {
        // Log any errors that occur while fetching or processing data
        console.error("Error loading custom data:", error);
    }
    return customData;
}



