//Handles Aura points of TransitAura

/**
 * Titles used for aura points
 * @param {*} auraPoints gets aura points of the user 
 * @returns title if the user has more than 0 aurapoints and "no Aura" if the user has 0.
 */
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
    // if user has no aurapoints, it return No Aura
    return "No Aura";
}

/**
 * How cards of the aura points title is displayed on the auraoints.html
 * @param {*} title gets the title of aura points
 * @param {*} points gets h ow many aura poits you ahve
 * @param {*} progress gets how much you have left in the progress
 * @returns a card for aura points.
 */

function createAchievementCard(title, points, progress) {
    return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">Points Required: ${points}</p>
                <div class="progress">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Function used to populate how many aura points you have and stores it in the user Docuemtn in firestore.
 */
function populateAuraPoints() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUser = db.collection("users").doc(user.uid);
            currentUser.get()
                .then(userDoc => {
                    if (userDoc.exists) {
                        const auraPoints = userDoc.data().auraPoints || 0;
                        const userTitle = calculateTitle(auraPoints);

                        // Update the points and title in the HTML
                        document.getElementById("userAuraPoints").innerText = `Points: ${auraPoints}`;
                        document.getElementById("titleDisplay").innerText = `Your Title: ${userTitle}`;

                        // Create achievements in ascending order
                        const titles = [
                            { points: 5, title: "Ligma" },
                            { points: 10, title: "Giga Ligma" },
                            { points: 25, title: "Beta" },
                            { points: 35, title: "Giga Beta" },
                            { points: 50, title: "Alpha" },
                            { points: 65, title: "Giga Alpha" },
                            { points: 80, title: "Sigma" },
                            { points: 100, title: "Giga Sigma" },
                            { points: 200, title: "Chad" },
                            { points: 500, title: "Giga Chad" }
                        ];

                        // Generate HTML for each achievement card
                        let achievementsHTML = "";
                        titles.forEach(level => {
                            // Calculate the progress percentage for each achievement level
                            const progress = Math.min((auraPoints / level.points) * 100, 100).toFixed(2);
                            // Add an achievement card to the HTML string
                            achievementsHTML += createAchievementCard(level.title, level.points, progress);
                        });
                        // Update the achievements container with the generated HTML
                        document.getElementById("achievementsContainer").innerHTML = achievementsHTML;
                    } else {
                        // Log a message if the user document does not exist
                        console.log("No user document found");
                    }
                })
                .catch(error => {
                    // Log any errors that occur during the document fetch
                    console.error("Error getting user document:", error);
                });
        } else {
            // Log a message if no user is signed in
            console.log("No user is signed in");
        }
    });
}

populateAuraPoints();
