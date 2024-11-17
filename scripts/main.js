// MAIN.JS HANDLES THE "CARDS" AND FIRESTORE UPLOAD FUNCTIONS

//  function getNameFromAuth() {
//      firebase.auth().onAuthStateChanged(user => {
//          // Check if a user is signed in:
//          if (user) {
//              // Do something for the currently logged-in user here: 
//              console.log(user.uid); //print the uid in the browser console
//              console.log(user.displayName);  //print the user name in the browser console
//              userName = user.displayName;

//              //method #1:  insert with JS
//              document.getElementById("name-goes-here").innerText = userName;    

//              //method #2:  insert using jquery
//              //$("#name-goes-here").text(userName); //using jquery

//              //method #3:  insert using querySelector
//              //document.querySelector("#name-goes-here").innerText = userName

//          } else {
//              // No user is signed in.
//              console.log ("No user is logged in");
//          }
//      });
//  }
//  getNameFromAuth(); //run the function


// function readQuote() {
//     db.collection("savedStations").doc("metrotown")  // Accessing the "Edmonds" document
//         .onSnapshot(docSnapshot => {
//             if (docSnapshot.exists) {
//                 console.log("Current document data: " + JSON.stringify(docSnapshot.data()));
//                 // Use the "savedStation" field instead of "quote"
//                 document.getElementById("quote-goes-here").innerHTML = docSnapshot.data().savedstation;
//             } else {
//                 console.log("No document found with the ID 'Edmonds'");
//             }
//         }, (error) => {
//             console.log("Error fetching document:", error);
//         });
// }
// readQuote();  // Call the function to read the data

// function writeSavedStations() {
    
//     var savedStationsRef = db.collection("savedStations");

//     savedStationsRef.doc("Metrotown Station").set({
//         code: "BBY01",
//         name: "Metrotown Station", 
//         city: "Burnaby",
//         province: "BC",
//         address: "4401 Beresford Street, Burnaby",
// 		details: "Located in Metrotown",
//         busy: "Not busy",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
//     savedStationsRef.doc("Royal Oak Staion").set({
//         code: "BBY02",
//         name: "Royal Oak Staion", 
//         city: "Burnaby",
//         province: "BC",
//         address: "5199 Beresford Street, Burnaby",
// 		details: "Located in Edmonds",
//         busy: "busy",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
//     savedStationsRef.doc("Edmonds Station").set({
//         code: "BBY03",
//         name: "Edmonds Station", 
//         city: "Burnaby",
//         province: "BC",
//         address: "6944 18th Avenue, Burnaby",
// 		details: "Located in Edmonds",
//         busy: "busy",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system timehttps://chatgpt.com/gpts
//     });
//     savedStationsRef.doc("Patterson Station").set({
//         code: "BBY04",
//         name: "Patterson Station", 
//         city: "Burnaby",
//         province: "BC",
//         address: "4101 Beresford St., Burnaby",
// 		details: "Located in Patterson",
//         busy: "not busy",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system timehttps://chatgpt.com/gpts
//     });
// }
 //writeSavedStations();         //if you used method 1




//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
// function displayCardsDynamically(collection) {
//     let cardTemplate = document.getElementById("savedStationsTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

//     db.collection(collection).get()   //the collection called "savedStations"
//         .then(allSavedStations => {
//             //var i = 1;  //Optional: if you want to have a unique ID for each hike
//             allSavedStations.forEach(doc => { //iterate thru each doc
//                 let name = doc.data().name;       // get value of the "name" key
//                 let details = doc.data().details;  // get value of the "details" key
// 				let busy = doc.data().busy;    //get unique ID to each hike to be used for fetching right image
//                 let address = doc.data().address; //gets busyness
//                 // let time_updated = doc.data().last_updated.toDate().toLocaleString(); // Convert Firestore timestamp to readable format
//                 let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

//                 //update title and text and image
//                 newcard.querySelector('.card-title').innerHTML = name;
//                 newcard.querySelector('.card-address').innerHTML = address;
//                 newcard.querySelector('.card-text').innerHTML = details;
//                 newcard.querySelector('.card-busy').innerHTML = busy;
//                 // newcard.querySelector('.card-time').innerHTML = time_updated;
//                 // newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg

//                 //Optional: give unique ids to all elements for future use
//                 // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
//                 // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
//                 // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);

//                 //attach to gallery, Example: "hikes-go-here"
//                 document.getElementById(collection + "-go-here").appendChild(newcard);

//                 //i++;   //Optional: iterate variable to serve as unique ID
//             })
//         })
// }

// displayCardsDynamically("savedStations");  //input param is the name of the collection


// function writeSavedRoutes() {
    
//     var savedRoutesRef = db.collection("savedRoutes");

//     savedRoutesRef.doc("bus-130").set({
//         code: "BUS130",
//         name: "Bus 130", 
//         city: "Burnaby",
// 		details: "Located in Metrotown",
//         busy: "Not busy",
//         safetyLevel: "dangerous",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
//     savedRoutesRef.doc("bus-222").set({
//         code: "BUS222",
//         name: "Bus 222", 
//         city: "Burnaby",
// 		details: "Located in Metrotown",
//         busy: "Not busy",
//         safetyLevel: "Safe",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
//     savedRoutesRef.doc("bus-119").set({
//         code: "BUS119",
//         name: "Bus 119", 
//         city: "Burnaby",
// 		details: "Located in Metrotown",
//         busy: "Not busy",
//         safetyLevel: "Safe",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
//     savedRoutesRef.doc("bus-19").set({
//         code: "BUS19",
//         name: "Bus 19", 
//         city: "Burnaby",
// 		details: "Located in Metrotown",
//         busy: "Not busy",
//         safetyLevel: "Moderate",
//         last_updated: firebase.firestore.FieldValue.serverTimestamp()  
//     });
// }
//writeSavedRoutes();         //if you used method 1

//  function displayRoutes(collection) {
//     let cardTemplate1 = document.getElementById("savedRoutesTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

//     db.collection(collection).get()   //the collection called "hikes"
//         .then(allSavedRoutes => {
//             //var i = 1;  //Optional: if you want to have a unique ID for each hike
//             allSavedRoutes.forEach(doc => { //iterate thru each doc
//                 let name1 = doc.data().name;       // get value of the "name" key
//                 let details1 = doc.data().details;  // get value of the "details" key
// 				let busy1 = doc.data().busy;    //get unique ID to each hike to be used for fetching right image
//                 let safetyLevel1 = doc.data().safetyLevel;
                
//                 // let time_updated = doc.data().last_updated.toDate().toLocaleString(); // Convert Firestore timestamp to readable format
//                 let newcard1 = cardTemplate1.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

//                 //update title and text and image
//                 newcard1.querySelector('.bus-title').innerHTML = name1;
//                 newcard1.querySelector('.bus-details').innerHTML = details1;
//                 newcard1.querySelector('.bus-busy').innerHTML = busy1;
//                 newcard1.querySelector('.bus-safetyLevel').innerHTML = safetyLevel1;                
//                 // newcard.querySelector('.card-time').innerHTML = time_updated;
//                 // newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg

//                 //Optional: give unique ids to all elements for future use
//                 // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
//                 // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
//                 // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);

//                 //attach to gallery, Example: "hikes-go-here"
//                 document.getElementById(collection + "-go-here").appendChild(newcard1);

//                 //i++;   //Optional: iterate variable to serve as unique ID
//             })
//         })
// }

// displayRoutes("savedRoutes");  //input param is the name of the collection





function displayStations(collection) {
    let cardTemplate = document.getElementById("stationsTemplate"); // Template for stations

    db.collection(collection).get()
        .then(allSavedStations => {
            allSavedStations.forEach(doc => {
                console.log("Document ID:", doc.id);
                console.log("Document Data:", doc.data()); // Log data for debugging

                // Check for the 'name' or 'station' field and use whichever exists
                let name = doc.data().name || doc.data().station || "Unnamed Station";
                let stationSafety = doc.data().currentSafetyLevel || "Unknown Safety Level";

                let newcard = cardTemplate.content.cloneNode(true); // Clone the template

                // Update the card with data
                newcard.querySelector('.station-title').innerHTML = name;
                newcard.querySelector('.station-safety').innerHTML = stationSafety;
                newcard.querySelector('a').href = "incidentReport.html?docID=" + doc.id;

                // Attach to gallery
                document.getElementById(collection + "-go-here").appendChild(newcard);
            });
        })
        .catch(error => {
            console.error("Error fetching stations:", error);
        });
}

// Call the function to display stations
displayStations("stations");



function displayRoutes(collection) {
    let cardTemplate = document.getElementById("routesTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

    db.collection(collection).get()   //the collection called "savedStations"
        .then(allSavedRoutes => {
            //var i = 1;  //Optional: if you want to have a unique ID for each hike
            allSavedRoutes.forEach(doc => { //iterate thru each doc
                let name = doc.data().routeName;       // get value of the "name" key
                //let details = doc.data().details;

                let routeNumber = doc.data().routeNumber;

                let routeSafety = doc.data().currentSafetyLevel;

                // let time_updated = doc.data().last_updated.toDate().toLocaleString(); // Convert Firestore timestamp to readable format
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.routes-title').innerHTML = name;
                //newcard.querySelector('.station-details').innerHTML = details;
                newcard.querySelector('.routes-number').innerHTML = routeNumber;

                newcard.querySelector('.routes-safetyLevel').innerHTML = routeSafety;
                // newcard.querySelector('.card-time').innerHTML = time_updated;
                // newcard.querySelector('.card-image').src = `./images/${hikeCode}.jpg`; //Example: NV01.jpg

                //Optional: give unique ids to all elements for future use
                // newcard.querySelector('.card-title').setAttribute("id", "ctitle" + i);
                // newcard.querySelector('.card-text').setAttribute("id", "ctext" + i);
                // newcard.querySelector('.card-image').setAttribute("id", "cimage" + i);

                //attach to gallery, Example: "hikes-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);

                //i++;   //Optional: iterate variable to serve as unique ID
            })
        })
}

displayRoutes("routes");  //input param is the name of the collection