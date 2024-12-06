/* Function used to display Stations in a card.*/ 
function displayStations(collection) {
    let cardTemplate = document.getElementById("stationsTemplate");

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

                //
                let iconID = 'save-' + doc.id;
                newcard.querySelector('i').id = iconID;
                // this is the single onclick handler that determines whether to save or 
                // update the bookmark based on the current state of the icon or the data
                // instead of having two handlers
                newcard.querySelector('i').id = 'save-' + doc.id;
                newcard.querySelector('i').onclick = () => {
                    const icon = document.getElementById('save-' + doc.id);
                    if (icon.innerText === 'bookmark') {
                        updateBookmark(doc.id); // If already bookmarked, remove it
                    } else {
                        saveBookmark(doc.id); // If not bookmarked, save it
                    }
                };



                // check if the station is already bookmarked
                // if you have no bookmarks = ok, doesnt break page
                currentUser.get().then(userDoc => {
                    // gets its from the bookmarksStation array or keeps it empty
                    let bookmarks = userDoc.data().bookmarksStation || [];
                    //get the user name
                    if (bookmarks.includes(doc.id)) {
                       document.getElementById(iconID).innerText = 'bookmark';
                    }
              })

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

                //attach to gallery, Example: "hikes-go-here"
                document.getElementById(collection + "-go-here").appendChild(newcard);

                //i++;   //Optional: iterate variable to serve as unique ID
            })
        })
}

displayRoutes("routes");  //input param is the name of the collection

//-----------------------------------------------------------------------------
// This function is called whenever the user clicks on the "bookmark" icon.
// It adds the hike to the "bookmarks" array
// Then it will change the bookmark icon from the hollow to the solid version. 
//-----------------------------------------------------------------------------
function saveBookmark(stationId) {
    // Manage the backend process to store the hikeDocID in the database, recording which hike was bookmarked by the user.
currentUser.update({
                    // Use 'arrayUnion' to add the new bookmark ID to the 'bookmarks' array.
            // This method ensures that the ID is added only if it's not already present, preventing duplicates.
        bookmarksStation: firebase.firestore.FieldValue.arrayUnion(stationId)
    })
            // Handle the front-end update to change the icon, providing visual feedback to the user that it has been clicked.
    .then(function () {
        console.log("bookmark has been saved for" + stationId);
        let iconID = 'save-' + stationId;
        //console.log(iconID);
                    //this is to change the icon of the hike that was saved to "filled"
        document.getElementById(iconID).innerText = 'bookmark';
    })
    // debug message if Firestore has issues
    .catch(function (error) {
        console.error("Error saving bookmark:", error);
    });
}

function updateBookmark(stationId){
    // alert("inside update bookmark");     //debug
    currentUser.get().then(doc => {
        //console.log(doc.data()).bookmarks; //debug
        currentBookmarks = doc.data().bookmarksStation;

        if (currentBookmarks && currentBookmarks.includes(stationId)) {
            console.log(stationId);
            currentUser.update({
                bookmarksStation: firebase.firestore.FieldValue.arrayRemove(stationId)
            })
            .then(function() {
                console.log("This bookmark is removed for " + currentUser);
                let iconID = "save-" + stationId;   //"save-2342342"
                console.log(iconID);
                document.getElementById(iconID).innerText = "bookmark_border";

            })
        } else {
            currentUser.set({
                bookmarksStation: firebase.firestore.FieldValue.arrayUnion(stationId),
            },
            {
                merge: true
            })
            .then(function(){
                console.log("This bookmark is removed for" + currentUser);
                let iconID = "save-" + stationId;   //"save-2342342"
                console.log(iconID);
                document.getElementById(iconID).innerText = "bookmark_border";
            })
        // debug message if Firestore has issues for updating the bookmarkStation array
        .catch(function (error) {
            console.error("Error adding bookmark:", error);
        });
    }
})
// debug message if Firestore has issues
.catch(function (error) {
    console.error("Error fetching current user data:", error);
});
}
