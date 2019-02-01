//TODO: local storage
//TODO: stop the echos

$(document).ready(function () {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyC3DrasuTKwDHLaaqV_hdlVnnLDqdTY1gE",
        authDomain: "dsm-simple-messaging.firebaseapp.com",
        databaseURL: "https://dsm-simple-messaging.firebaseio.com",
        projectId: "dsm-simple-messaging",
        storageBucket: "dsm-simple-messaging.appspot.com",
        messagingSenderId: "634303355719"
    };
    firebase.initializeApp(config);

    var database = firebase.database();
    var userID;
    var userSignedIn;
    var userName;
    var userIdentificationPath;
    var userInstancesPath;
    var userMessagesPath;
    var userLatitude;
    var userLongitude;
    var theLastMessageDateTime;
    var geolocationListField = $("#geolocation-list");
    var geolocationStatusField = $("#geolocation-status");
    var mapDisplayField = $("#map-display");
    var initMapLatLong;


    $(".add-entry").on("click", function (event) {
        event.preventDefault();
        doAddEntry();
    });

    $("#send-link").on("click", function () {
        console.log("sending user instances path: " + userInstancesPath);
        let theEmailAddressToSendLinkTo = prompt("Please enter the email address to send the link to:");
        if (theEmailAddressToSendLinkTo != null) {
            sendEmailLink(theEmailAddressToSendLinkTo);
        }
    });

    $("#sign-out").on("click", function () {
        signOut();
        emptyInputFields();
    });

    function doAddEntry(automatic) {
        let todaysDate = new Date().toLocaleDateString("en-US");
        let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log("do add entry:" + automatic + ", userID is: " + userID);
        if (automatic != "connected" && automatic != "disconnected") {
            var entryMessage = $("#input-message").val().trim() + "<br>";
        } else {
            if (automatic == "connected") {
                var entryMessage = userName + " has connected<br>";
            } else {
                var entryMessage = userName + " has disconnected<br>";
            };
        };
        database.ref(userMessagesPath).set({
            dateTime: todaysDate + " " + currentTime,
            userName: userName,
            message: entryMessage,
            currentGeolocation: "Latitude: " + userLatitude +
                ", Longitude: " + userLongitude
        });
        database.ref(userMessagesPath).set({
            dateTime: todaysDate + " " + currentTime,
            userName: userName,
            message: entryMessage,
            currentGeolocation: "Latitude: " + userLatitude +
                ", Longitude: " + userLongitude
        });
        $("#input-message").val("");
    };

    database.ref(userMessagesPath).on("value", function (snapshot) {
        let theMessageDateTime = snapshot.child(userMessagesPath + "/dateTime/").val();
        let theMessageUserName = snapshot.child(userMessagesPath + "/userName/").val();
        let theMessageMessage = snapshot.child(userMessagesPath + "/message/").val();
        let theCurrentGeolocation = snapshot.child(userMessagesPath + "/currentGeolocation/").val();
        if (theMessageDateTime != null && theMessageDateTime != theLastMessageDateTime) {
            $("#message-display").prepend("<span class='monospace'>" + theMessageDateTime + " <strong>" + theMessageUserName + "</strong>:</span> " + theMessageMessage);
            theLastMessageDateTime = theMessageDateTime;
        };
        if ((theCurrentGeolocation != "Latitude: undefined, Longitude: undefined") && (theCurrentGeolocation != null)) {
            geolocationListField.prepend(theMessageDateTime + " <strong>" + theMessageUserName + "</strong>: " + theCurrentGeolocation + "<br>");
        };
    }, function (errorObject) {
        console.log("entries-error: " + errorObject.code);
    });

    function emptyInputFields() {
        console.log("empty input fields");
        $("#input-message").val("");
        $("#message-display").text("");
        $("#geolocation-list").text("");
        $("#map-display").text("");
        userID = "";
        userSignedIn = "";
        userName = "";
        userIdentificationPath = "";
        userInstancesPath = "";
        userMessagesPath = "";
        userLatitude = "";
        userLongitude = "";
    };

    //#region - authorization
    //--> how to fold a region //#region and //#endregion and //region and //endregion
    function toggleSignIn() {
        if (firebase.auth().currentUser) {
            //do signout
        } else {
            var email = document.getElementById("email").value;
            var password = document.getElementById("password").value;
            if (email.length < 4) {
                alert("Please enter an email address.");
                return;
            }
            if (password.length < 4) {
                alert("Please enter a password.");
                return;
            }
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode === "auth/wrong-password") {
                    alert("Password is incorrect.");
                } else {
                    alert(errorMessage);
                }
                handleError(error);
            });
        }
    }

    //Handles the sign up button press.
    function handleSignUp() {
        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;
        if (email.length < 4) {
            alert("Please enter an email address.");
            return;
        }
        if (password.length < 4) {
            alert("Please enter a password.");
            return;
        }
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == "auth/weak-password") {
                alert("The password must be at least 6 characters.");
            } else {
                alert(errorMessage);
            }
            handleError(error);
        });
    }

    function handleSignIn() {
        console.log("handle sign-in");
        if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
            turnURLIntoUserInstancesPath();
            // Disable the sign-in button during async sign-in tasks.
            // document.getElementById("sign-in").disabled = true;
            // Get the email if available.
            // var email = window.localStorage.getItem('emailForSignIn');
            // if (!email) {
            //     // User opened the link on a different device. To prevent session fixation attacks, ask the
            //     // user to provide the associated email again. For example:
            //     email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.');
            // }
            if (1 == 2) {
                // if (email) {
                firebase.auth().signInWithEmailLink(email, window.location.href).then(function (result) {
                    turnURLIntoUserInstancesPath();
                }).catch(function (error) {
                    handleError(error);
                });
            }
        }
    }

    function sendPasswordReset() {
        var email = document.getElementById("email").value;
        firebase.auth().sendPasswordResetEmail(email).then(function () {
            alert("If there is an account with the address '" + email + "', a password reset link will be sent to that address.");
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == "auth/invalid-email") {
                alert(errorMessage);
            } else if (errorCode == "auth/user-not-found") {
                alert(errorMessage);
            }
            handleError(error);
        });
    }
    //#endregion

    //#region - connections
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    connectedRef.on("value", function (connectedSnapshot) {
        if (connectedSnapshot.val()) {
            var theConnection = connectionsRef.push(true);
            theConnection.onDisconnect().remove();
        };
    });
    connectionsRef.on("value", function (connectionsSnapshot) {
        console.log("number online: " + connectionsSnapshot.numChildren());
    }); // Number of online users is the number of objects in the presence list.

    firebase.auth().signInAnonymously().catch(function (error) {
        console.log("sign in anonymously");
        let errorCode = error.code;
        let errorMessage = error.message;
        console.log("anonymous login error: " + errorCode, errorMessage);
        // ...
    });

    function turnURLIntoUserInstancesPath() {
        let theLink = window.location.href;
        window.history.replaceState({}, document.title, window.location.href.split('?')[0]);//cleans up sign-in link params
        let theInstancesPath = (theLink.substring((theLink.indexOf("?") + 1), theLink.indexOf("&")));
        if (theInstancesPath != null) {
            userInstancesPath = decodeURIComponent(theInstancesPath);
            userMessagesPath = userInstancesPath + "/messages";
            console.log("new path: " + decodeURIComponent(theInstancesPath));
        } else {
            console.log("new path was null, existing path is: " + userInstancesPath);
        };
    };

    function signOut() {
        doAddEntry("disconnected");
        firebase.auth().signOut();
        userSignedIn = false;
        window.localStorage.removeItem("userInstancesPath");
        emptyInputFields();
        window.history.replaceState({}, document.title, window.location.href.split('?')[0]);//cleans up sign-in link params
        location = location;
    };

    function sendEmailLink(theEmailAddress) {
        let actionCodeSettings = {
            // URL must be whitelisted in the Firebase Console.
            'url': "https://desmondmullen.com/simple-messaging/?" + userInstancesPath,
            'handleCodeInApp': true // This must be true.
        };
        firebase.auth().sendSignInLinkToEmail(theEmailAddress, actionCodeSettings).then(function () {
            window.localStorage.setItem("userInstancesPath", userInstancesPath);
            alert('An email was sent to ' + theEmailAddress + '. This instance can be accessed by anyone using the link in that email.');
        }).catch(function (error) {
            handleError(error);
        });
    }

    function handleError(error) {
        let errorCode = error.code;
        let errorMessage = error.message;
        alert('Error: ' + errorMessage);
        console.log("handle error: " + errorCode, errorMessage);
        // document.getElementById("sign-in").disabled = false;
    }
    //#endregion

    function initializeDatabaseReferences() {
        let localStorageUIPath = window.localStorage.getItem("userInstancesPath");
        console.log("localStorageUIPath: " + localStorageUIPath);
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                console.log("auth state changed: " + user.uid);
                userID = user.uid; //when connecting by link, this will be the same user
                let shortUserID = Math.floor(Math.random() * 1000 + 1000);
                userName = prompt("Please enter a name to use for sending messages. If you don't choose one, we'll call you by this random number:", shortUserID);
                if (userName == null || userName.trim() == "") {
                    userName = shortUserID;
                };
                // User is signed in.
                userSignedIn = true;
                userIdentificationPath = "users/" + userID + "/identification";
                if (window.location.href.indexOf("?") > 0) {
                    turnURLIntoUserInstancesPath();
                    console.log("user ID after signout: " + userID);
                } else {
                    if (localStorageUIPath != null) {
                        userInstancesPath = localStorageUIPath;
                    } else {
                        userInstancesPath = "users/" + userID + "/instances/" + (+new Date());
                    }
                    userMessagesPath = userInstancesPath + "/messages";
                }
                getLocation();
                setTimeout(function () {
                    doAddEntry("connected");
                }, 2000);
            };
        });
    }

    initializeDatabaseReferences();

    //#region - geolocation
    // function getLocation() {
    //     if (navigator.geolocation) {
    //         navigator.geolocation.getCurrentPosition(showPosition);
    //     } else {
    //         geolocationStatusField.text("Geolocation is not supported by this browser");
    //     }
    // }

    function showError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                geolocationStatusField.text("User denied the request for Geolocation");
                break;
            case error.POSITION_UNAVAILABLE:
                geolocationStatusField.text("Location information is unavailable");
                break;
            case error.TIMEOUT:
                geolocationStatusField.text("The request to get user location timed out");
                break;
            case error.UNKNOWN_ERROR:
                geolocationStatusField.text("An unknown error occurred");
                break;
        }
    }

    // function showPosition(position) {
    //     userLatitude = position.coords.latitude;
    //     userLongitude = position.coords.longitude;
    //     let latitudeLongitude = userLatitude + "," + userLongitude;
    //     let mapURL = encodeURI("https://maps.googleapis.com/maps/api/staticmap?center=" + latitudeLongitude + "&zoom=16&size=400x300&sensor=false&key=AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc");

    //     mapDisplayField.html("<img src='" + mapURL + "'>");
    //     geolocationStatusField.html("Latitude: " + userLatitude +
    //         ", Longitude: " + userLongitude);
    // }

    // the following line goes with the function below. This is from
    // https://developers.google.com/maps/documentation/javascript/examples/marker-simple
    // <script async defer src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script >


    // function initMap() {
    //     var myLatLng = { lat: userLatitude, lng: userLongitude };

    //     var map = new google.maps.Map(document.getElementById("map-display"), {
    //         zoom: 4,
    //         center: myLatLng
    //     });

    //     var marker = new google.maps.Marker({
    //         position: myLatLng,
    //         map: map,
    //         title: 'my location'
    //     });
    // }
    //#endregion

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            geolocationStatusField.text("Geolocation is not supported by this browser");
        }
    }

    getLocation();

    function showPosition(position) {
        userLatitude = parseFloat(position.coords.latitude);
        userLongitude = parseFloat(position.coords.longitude);
        if (initMapLatLong != userLatitude, userLongitude) {
            console.log("redoing initMap: " + initMapLatLong + " / " + userLatitude, userLongitude);
            initMap();
        } else {
            console.log("show position: " + userLatitude, userLongitude);
            let userLatLong = { lat: userLatitude, lng: userLongitude };
            let theZoom = 16;
            let mapURL = encodeURI("https://maps.googleapis.com/maps/api/js?center=" + userLatLong + "&zoom=" + theZoom + "&size=400x300&sensor=false&key=AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc&callback=initMap");
            mapDisplayField.html("<img src='" + mapURL + "'>");
        }
    }

    // let mapURL = encodeURI("https://maps.googleapis.com/maps/api/js?key=AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc&callback=initMap");
    // mapDisplayField.html("<img src='" + mapURL + "'>");



    function initMap() {
        setTimeout(function () {
            console.log("init map: " + userLatitude, userLongitude);
            initMapLatLong = userLatitude, userLongitude;
            let userLatLong = { lat: userLatitude, lng: userLongitude };
            let theZoom = 16;
            let theKey = "AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc";
            // let mapURL = encodeURI("https://maps.googleapis.com/maps/api/js?center=" + userLatLong + "&zoom=" + theZoom + "&size=400x300&sensor=false&key=AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc&callback=initMap");
            // mapDisplayField.html("<img src='" + mapURL + "'>");
            var map = new google.maps.Map(mapDisplayField, {
                zoom: theZoom,
                center: userLatLong,
                key: theKey
            });
            var marker = new google.maps.Marker({
                position: userLatLong,
                map: map,
                title: 'You are here'
            });
            var userLatLong = { lat: userLatitude + .001, lng: userLongitude + .001 };
            var marker = new google.maps.Marker({
                position: userLatLong,
                map: map,
                title: 'She is here'
            });
            placeMarker(userLatitude - .001, userLongitude - .001, "new marker")
        }, 500);
    }

    function placeMarker(latitude, longitude, title) {
        var userLatLong = { lat: userLatitude, lng: userLongitude };
        var marker = new google.maps.Marker({
            position: userLatLong,
            map: map,
            title: 'You are here'
        });

    };

    console.log("v1.8");
});