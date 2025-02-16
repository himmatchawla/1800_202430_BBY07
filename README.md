# Project Title
TransitAura

# Demo Video
[TransitAura Demo Video](https://www.youtube.com/watch?v=X8kUT-Y-a_0)

# Documentation
[TransitAura Documentation](https://docs.google.com/document/d/1mG4sfPl3H-4ThuyIjgPwz161AwWd6HBIFDg_cFKzbqE/edit?usp=sharing)


## 1. Project Description
TransitAura is a transit safety app that helps citizens of Metro Vancouver feel safe and confident on public transit. The app provides the ability to check real-time, user-reported safety levels and incident reports. Every user can earn Aura Points for submitting their own safety levels and incidents.

## 2. Names of Contributors
* Himmat Chawla
* Sophia Diluvio
* Hayden Baek
	
## 3. Technologies and Resources Used
* HTML, CSS, and JavaScript
* Firebase Authentication
* Firebase Firestore
* Firebase Hosting
* SweetAlert JS
* Mapbox API
* Skytrain stations Api (Downloaded from city of Vanouver, Burnaby, Richmond and we modified it to fit into our project)

## 4. Complete setup/installion/usage
This is a web app (website)
* Option 1: Clone or fork this repo, and use VS Code Live Server on index.html
* Option 2: visit transitaura.web.app

## 5. Known Bugs and Limitations
Users can submit unlimited safety levels. This is done on purpose, so that users may play around during the class demo and the teacher can see the updates in real-time. This must be changed after the teacher marks the project.

## 6. Features for Future
Social leaderboard
Better incentives with Aura Points
	
## 7. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore                  # Git ignore file
├── README.md                   # readme file
├── .firebaserc                 # firebase config file
├── .gitignore                  # Git ignore file
├── 404.html                    # standard 404 page
├── aboutus.html                # about us page
├── aurapoints.html             # page where users can see their points
├── firebase.json               # firebase config file
├── firestore.indexes.json      # firebase config file
├── index.html                  # landing HTML page
├── login.html                  # login page
├── main.html                   # main after-login page
├── package-lock.json           # firebase config file
├── profile.html                # page for users to edit their profile
├── README.md                   # readme file
├── route.html                  # template page for routes
├── searchroutes.html           # search routes here
├── searchstations.html         # search stations here
└── station.html                # template page for stations

It has the following subfolders and files:
├── .vscode                     # folder for vscode config
├── APIs                        # Folder for images
    /bus-routes-doubled.json        # bus routes before delimiting with /
    /rapid-transit-stations         # stations with geodata
        -with-coordinates.json      # stations with geodata
    /rapid-transit-stations.json    # stations without geodata
    /transformed-bus-routes.json    # bus stations after delimiting with /
├── discard                     # place to keep trash that might come in handy later
    /...                        # files to discard
    /...                        # files to discard
├── media                       # images, etc
    /...                        # icons, mockups etc
    /...                        # icons, mockups etc
├── scripts                     # contains JavaScript
    /aurapoints.js              # handles aura points
    /bookmark.js                # handles bookmarks
    /firebaseConfig.js          # initializes firebase
    /login.js                   # handles login
    /map.js                     # handles the map
    /profile.js                 # handles changing user fields
    /recentlyviewed.js          # handles recently viwed
    /search.js                  # handles search functionalities
    /skeleton.js                # handles displaying navbar
    /stationsandroutes.js       # main functionality of app
    /utils.js                   # contains utility functions
├── styles                      # contains CSS
    /images.css                 # styles
    /styles.css                 # styles
├── text                        # contains navbars
    /footer.html                # contains footer structure
    /nav_after_login.html       # contains nav after login structure
    /nav_before_login.html      # contains nav before login structure
```


