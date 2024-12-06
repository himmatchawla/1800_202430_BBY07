//PROFILE.JS HANDLES UPDATING USER INFO IN FIRESTORE

// Function to populate user info
function populateUserInfo() {
    firebase.auth().onAuthStateChanged(user => {
        // Check if user is signed in:
        if (user) {

            // Go to the correct user document by referencing the user UID
            let currentUser = db.collection("users").doc(user.uid);
            // Get the document for the current user
            currentUser.get()
                .then(userDoc => {
                    if (userDoc.exists) {
                        //get the data fields of the user
                        let userEmail = userDoc.data().email;
                        let userName = userDoc.data().name;

                        //if the data fields are not empty, write them into the form.
                        if (userEmail) { // CHANGE: I TOOK AWAY != null and just left it as "userEmail"
                            document.getElementById("userEmail").value = userEmail;
                        }
                        if (userName) { // CHANGE: I TOOK AWAY != null and just left it as "userName"
                            document.getElementById("nameInput").value = userName;
                        }
                    } else { // CHANGE: ADDED ELSE BLOCK FOR ERROR LOGGING
                        console.log("No user document found");
                    }
                })
                .catch(error => { // CHANGE: ADDED CATCH BLOCK
                    console.error("Error getting user document:", error);
                });
        } else {
            // No user is signed in
            console.log("No user is signed in");
        }
    });
}

//call the function to run it
populateUserInfo();


function editUserInfo() {
    //enable the form fields
    document.getElementById('personalInfoFields').disabled = false;
}

function saveUserInfo() {
    //a) Get user-entered values
    let userEmail = document.getElementById("userEmail").value; // CHANGE: changed to let format instead of "user.data().email"
    let userName = document.getElementById("nameInput").value;// CHANGE: changed to let format instead of "user.data().DisplayName"

    //b)get the current user document AND update Firestore
    firebase.auth().onAuthStateChanged(user => {
        if (user) { // CHANGE: added code to make sure user is authenticated
            let currentUser = db.collection("users").doc(user.uid); // CHANGE: redefined currentUser
            currentUser.update({
                email: userEmail,
                name: userName,
            })
                .then(() => {
                    console.log("Document successfully updated!");
                })
                .catch(error => { // CHANGE: catch block
                    console.error("Error updating document:", error);
                });
        } else { // CHANGE: error logging
            console.log("No user is signed in");
        }
    });

    // c) Disable edit
    document.getElementById('personalInfoFields').disabled = true;
}
