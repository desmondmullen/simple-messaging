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
    var geolocationListField = $("#geolocation-list");
    var geolocationStatusField = $("#geolocation-status");
    var mapDisplayField = $("#map-display");

    $(".add-entry").on("click", function (event) {
        event.preventDefault();
        let todaysDate = new Date().toLocaleDateString("en-US");
        let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let entryMessage = $("#input-message").val().trim() + "<br>";
        database.ref(userMessagesPath).set({
            dateTime: todaysDate + " " + currentTime,
            userName: userName,
            message: entryMessage,
            currentGeolocation: "Latitude: " + userLatitude +
                ", Longitude: " + userLongitude
        });
        $("#input-message").val("");
    });

    $("#send-link").on("click", function () {
        console.log("user instances path: " + userInstancesPath);
        let theEmailAddressToSendLinkTo = prompt("Please enter the email address to send the link to:");
        if (theEmailAddressToSendLinkTo != null) {
            sendEmailLink(theEmailAddressToSendLinkTo);
        }
    });

    $("#goto-instance").on("click", function () {
        console.log("path before: " + userInstancesPath);
        console.log("path before: " + userMessagesPath);
        tempUserInstancesPath = prompt("Please enter the instance address:");
        if (tempUserInstancesPath != null) {
            userInstancesPath = tempUserInstancesPath
            userMessagesPath = userInstancesPath + "/messages";
        }
        console.log("path after: " + userInstancesPath);
        console.log("path after: " + userMessagesPath);
    });

    $("#sign-out").on("click", function () {
        signOut();
        emptyInputFields();
    });

    $("#test-only").on("click", function () {
        console.log("path: " + userInstancesPath);

    });

    database.ref(userMessagesPath).on("value", function (snapshot) {
        let theMessageDateTime = snapshot.child(userMessagesPath + "/dateTime/").val();
        let theMessageUserName = snapshot.child(userMessagesPath + "/userName/").val();
        let theMessageMessage = snapshot.child(userMessagesPath + "/message/").val();
        let theCurrentGeolocation = snapshot.child(userMessagesPath + "/currentGeolocation/").val();
        if (theMessageDateTime != null) {
            $("#message-display").prepend("<span class='monospace'>" + theMessageDateTime + " <strong>" + theMessageUserName + "</strong>:</span> " + theMessageMessage);
        };
        if (theCurrentGeolocation != "Latitude: undefined, Longitude: undefined") {
            geolocationListField.prepend(theMessageDateTime + " <strong>" + theMessageUserName + "</strong>: " + theCurrentGeolocation + "<br>");
        };
    }, function (errorObject) {
        console.log("entries-error: " + errorObject.code);
    });

    function emptyInputFields() {
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

    emptyInputFields();

    //----------------------authorization-----------------------
    //#region
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
        console.log("doing handle sign-in");
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
                    // Clear the URL to remove the sign-in link parameters.
                    // if (history && history.replaceState) {
                    //     console.log("history");
                    //     window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
                    // }
                    // Clear email from storage.
                    // window.localStorage.removeItem('emailForSignIn');
                    // var user = result.user;
                    // var isNewUser = result.additionalUserInfo.isNewUser;
                    // console.log(result)
                }).catch(function (error) {
                    handleError(error);
                });
            }
        }
    }

    function turnURLIntoUserInstancesPath() {
        let theLink = window.location.href;
        let theInstancesPath = (theLink.substring((theLink.indexOf("?") + 1), theLink.indexOf("&")));
        userInstancesPath = decodeURIComponent(theInstancesPath);
        userMessagesPath = userInstancesPath + "/messages";
        console.log("new path: " + decodeURIComponent(theInstancesPath));
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

    //---------------------------------------------
    //#endregion

    //----------------------
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    connectedRef.on("value", function (connectedSnapshot) {
        if (connectedSnapshot.val()) {
            var theConnection = connectionsRef.push(true);
            theConnection.onDisconnect().remove();
            console.log("number online 1: " + connectedSnapshot.numChildren());
        };
    });
    connectionsRef.on("value", function (connectionsSnapshot) {
        console.log("number online 2: " + connectionsSnapshot.numChildren());
    });
    // Number of online users is the number of objects in the presence list.
    //----------------------

    firebase.auth().signInAnonymously().catch(function (error) {
        console.log("sign in anon");
        let errorCode = error.code;
        let errorMessage = error.message;
        console.log("anonymous login error: " + errorCode, errorMessage);
        // ...
    });

    function signOut() {
        firebase.auth().signOut();
        userSignedIn = false;
    };

    function sendEmailLink(theEmailAddress) {
        let actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this URL
            // must be whitelisted in the Firebase Console.
            'url': "https://desmondmullen.com/simple-messaging/?" + userInstancesPath,
            'handleCodeInApp': true // This must be true.
        };
        firebase.auth().sendSignInLinkToEmail(theEmailAddress, actionCodeSettings).then(function () {
            // Save the email locally so you don’t need to ask the user for it again if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', theEmailAddress);
            // The link was successfully sent. Inform the user.
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

    //initializeDatabaseReferences handles setting up UI event listeners and registering Firebase auth listeners:
    function initializeDatabaseReferences() {
        console.log("initializing database");
        // var email = window.localStorage.getItem('emailForSignIn');
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                console.log("auth state changed: " + user.uid);
                userName = prompt("Please enter a name to use for sending messages:");
                // User is signed in.
                userID = user.uid;
                userSignedIn = true;
                if (window.location.href.indexOf("?") > 0) {
                    turnURLIntoUserInstancesPath();
                } else {
                    userIdentificationPath = "users/" + userID + "/identification";
                    userInstancesPath = "users/" + userID + "/instances/" + (+new Date());
                    userMessagesPath = userInstancesPath + "/messages";
                }
                getLocation();
            };
        });
    }
    // handleSignIn();
    initializeDatabaseReferences();

    //------------------------------------------------
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            geolocationStatusField.text("Geolocation is not supported by this browser");
        }
    }

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

    function showPosition(position) {
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;
        let latitudeLongitude = userLatitude + "," + userLongitude;
        let mapURL = encodeURI("https://maps.googleapis.com/maps/api/staticmap?center=" + latitudeLongitude + "&zoom=14&size=200x150&sensor=false&key=AIzaSyBPchfMQ9Do2TWSFQTKjKJlitT5y_Fdrdc");

        mapDisplayField.html("<img src='" + mapURL + "'>");
        geolocationStatusField.html("Latitude: " + userLatitude +
            ", Longitude: " + userLongitude);
    }

    // the following line goes with the function below. This is from
    // https://developers.google.com/maps/documentation/javascript/examples/marker-simple
    // <script async defer src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script >


    function initMap() {
        var myLatLng = { lat: userLatitude, lng: userLongitude };

        var map = new google.maps.Map(document.getElementById("map-display"), {
            zoom: 4,
            center: myLatLng
        });

        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: 'my location'
        });
    }


    //------------------------------------------------
    console.log("v1.7582");
});