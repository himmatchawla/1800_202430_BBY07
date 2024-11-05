//---------------------------------
// Your own functions here
//---------------------------------


function sayHello() {
  //do something
}
//sayHello();    //invoke function

//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log("logging out user");
  }).then(() => {
    window.location.href = "/"
  }).catch((error) => {
    // An error happened.
  });
}

//back button, goes back to previous page
function goBack() {
  window.history.back();
}
