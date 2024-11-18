//Global variable pointing to the current user's Firestore document
var user;   

//Function that calls everything needed for the main page  
function doAll() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = db.collection("users").doc(user.uid); //global
            console.log(currentUser);
        } else {
            console.log("No user is signed in");
            window.location.href = "login.html";
        }
    });
}
doAll();

//-----------------------------------------------------------------------------
// This function is called whenever the user clicks on the "bookmark" icon.
// It adds the hike to the "bookmarks" array
// Then it will change the bookmark icon from the hollow to the solid version. 
//-----------------------------------------------------------------------------
function saveBookmarkStation(stationId) {
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
    });
}

// // save bookmark function
// async function saveBookmarkStation(stationId) {
//     const user = firebase.auth().currentUser;

//     if (!user) {
//         document.getElementById("successMessage").textContent = "Please log in to report safety levels.";
//         document.getElementById("successMessage").style.color = "red";
//         return;
//     }

//     const userId = user.uid;

//     try {
//         const newBookmarkStation = dbcollection("stations").doc(stationID).colle
//     }
// //---------------------------------------------------------------------------------
