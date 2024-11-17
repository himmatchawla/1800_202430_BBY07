
var stationDocID = localStorage.getItem("stationDocID");    //visible to all functions on this page

function getStationName(id) {
    console.log(id);
    db.collection("stations")
      .doc(id)
      .get()
      .then((thisStation) => {
        var stationName = thisStation.data().name;
        document.getElementById("stationName").innerHTML = stationName;
          });
}

getStationName(stationDocID);

function writeStationReport() {
    console.log("inside write review");
    let stationTitle = document.getElementById("stationReport-title").value;
    let stationType = document.getElementById("stationReport-type").value;
    let stationDate = document.getElementById("stationReport-date").value;
    let stationTime = document.getElementById("stationReport-time").value;
    let stationDescription = document.getElementById("stationReport-description").value;

    console.log(stationTitle, stationType, stationDate, stationTime, stationDescription,);


    var user = firebase.auth().currentUser;
    if (user) {
        var currentUser = db.collection("users").doc(user.uid);
        var userID = user.uid;

        // Get the document for the current user.
        db.collection("stationReports").add({
            stationDocID: stationDocID,
            userID: userID,
            title: stationTitle,
            type: stationType,
            date: stationDate,
            time: stationTime,
            description: stationDescription,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            window.location.href = "thanks.html"; // Redirect to the thanks page
        });
    } else {
        console.log("No user is signed in");
        window.location.href = 'review.html';
    }
}