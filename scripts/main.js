// function getNameFromAuth() {
//     firebase.auth().onAuthStateChanged(user => {
//         // Check if a user is signed in:
//         if (user) {
//             // Do something for the currently logged-in user here: 
//             console.log(user.uid); //print the uid in the browser console
//             console.log(user.displayName);  //print the user name in the browser console
//             userName = user.displayName;

//             //method #1:  insert with JS
//             document.getElementById("name-goes-here").innerText = userName;    

//             //method #2:  insert using jquery
//             //$("#name-goes-here").text(userName); //using jquery

//             //method #3:  insert using querySelector
//             //document.querySelector("#name-goes-here").innerText = userName

//         } else {
//             // No user is signed in.
//             console.log ("No user is logged in");
//         }
//     });
// }
// getNameFromAuth(); //run the function


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

function writeSavedStations() {
    //define a variable for the collection you want to create in Firestore to populate data
    var savedStationsRef = db.collection("savedStations");

    savedStationsRef.doc("Metrotown Station").set({
        code: "BBY01",
        name: "Metrotown Station", //replace with your own city?
        city: "Burnaby",
        province: "BC",
        address: "4401 Beresford Street, Burnaby",
		details: "Located in Metrotown",
        busy: "Not busy",
        last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system time
    });
    savedStationsRef.doc("Rotyal Oak Staion").set({
        code: "BBY02",
        name: "Rotyal Oak Staion", //replace with your own city?
        city: "Burnaby",
        province: "BC",
        address: "5199 Beresford Street, Burnaby",
		details: "Located in Edmonds",
        busy: "busy",
        last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system time
    });
    savedStationsRef.doc("Edmonds Station").set({
        code: "BBY03",
        name: "Edmonds Station", //replace with your own city?
        city: "Burnaby",
        province: "BC",
        address: "6944 18th Avenue, Burnaby",
		details: "Located in Edmonds",
        busy: "busy",
        last_updated: firebase.firestore.FieldValue.serverTimestamp()  //current system timehttps://chatgpt.com/gpts
    });
}
// writeSavedStations();         //if you used method 1


//------------------------------------------------------------------------------
// Input parameter is a string representing the collection we are reading from
//------------------------------------------------------------------------------
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("savedStationsTemplate"); // Retrieve the HTML element with the ID "hikeCardTemplate" and store it in the cardTemplate variable. 

    db.collection(collection).get()   //the collection called "hikes"
        .then(allSavedStations => {
            //var i = 1;  //Optional: if you want to have a unique ID for each hike
            allSavedStations.forEach(doc => { //iterate thru each doc
                let name = doc.data().name;       // get value of the "name" key
                let details = doc.data().details;  // get value of the "details" key
				let busy = doc.data().busy;    //get unique ID to each hike to be used for fetching right image
                let address = doc.data().address; //gets busyness
                // let time_updated = doc.data().last_updated.toDate().toLocaleString(); // Convert Firestore timestamp to readable format
                let newcard = cardTemplate.content.cloneNode(true); // Clone the HTML template to create a new card (newcard) that will be filled with Firestore data.

                //update title and text and image
                newcard.querySelector('.card-title').innerHTML = name;
                newcard.querySelector('.card-address').innerHTML = address;
                newcard.querySelector('.card-text').innerHTML = details;
                newcard.querySelector('.card-busy').innerHTML = busy;
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

displayCardsDynamically("savedStations");  //input param is the name of the collection