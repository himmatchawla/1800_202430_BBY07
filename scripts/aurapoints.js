function calculateTitle(auraPoints) {
    const titles = [
        { points: 500, title: "Giga Chad" },
        { points: 200, title: "Chad" },
        { points: 100, title: "Giga Sigma" },
        { points: 80, title: "Sigma" },
        { points: 65, title: "Giga Alpha" },
        { points: 50, title: "Alpha" },
        { points: 35, title: "Giga Beta" },
        { points: 25, title: "Beta" },
        { points: 10, title: "Giga Ligma" },
        { points: 5, title: "Ligma" },
    ];

    for (const level of titles) {
        if (auraPoints >= level.points) {
            return level.title;
        }
    }

    return "No Title"; 
}


function populateAuraPoints() {
    firebase.auth().onAuthStateChanged(user => {
        // Check if the user is signed in:
        if (user) {
            // Reference the user document by their UID
            let currentUser = db.collection("users").doc(user.uid);
            // Get the document for the current user
            currentUser.get()
                .then(userDoc => {
                    if (userDoc.exists) {
                        // Get the aura points from the document
                        let userAuraPoints = userDoc.data().auraPoints;

                        if (userAuraPoints !== undefined) {
                            // Calculate the user's title
                            const userTitle = calculateTitle(userAuraPoints);

                            // Update the points and title in the HTML
                            document.getElementById("userAuraPoints").innerText = `Points: ${userAuraPoints}`;
                            document.getElementById("titleDisplay").innerText = `Title: ${userTitle}`;
                        } else {
                            document.getElementById("userAuraPoints").innerText = "Points: No points available";
                            document.getElementById("titleDisplay").innerText = "Title: No Title";
                        }
                    } else {
                        console.log("No user document found");
                    }
                })
                .catch(error => {
                    console.error("Error getting user document:", error);
                });
        } else {
            // No user is signed in
            console.log("No user is signed in");
        }
    });
}

populateAuraPoints();

