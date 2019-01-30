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
    var actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this URL
        // must be whitelisted in the Firebase Console.
        'url': 'https://desmondmullen.com/simple-messaging/', // Here we redirect back to this same page.
        // 'url': window.location.href, // Here we redirect back to this same page.
        'handleCodeInApp': true // This must be true.
    };


    var userID;
    var userSignedIn;
    var userEmail;
    var userStatisticsPath;
    var userUsersPath;
    var userMessagesPath;
    var userLatitude;
    var userLongitude;
    var geolocationListField = $("#geolocation-list");
    var geolocationStatusField = $("#geolocation-status");
    var mapDisplayField = $("#map-display");



    function displayApplicationOrAuthentication() {
        if (userSignedIn === true) {
            //displayApplication
            $("#application").css("display", "inline");
            $("#authentication").css("display", "none");
            $("#sign-out").css("display", "inline");
        } else {
            //displayAuthentication
            $("#application").css("display", "none");
            $("#authentication").css("display", "inline-block");
            $("#sign-out").css("display", "none");
        }
    };
    displayApplicationOrAuthentication()

    $(".add-entry").on("click", function (event) {
        event.preventDefault();
        let todaysDate = new Date().toLocaleDateString("en-US");
        let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let entryMessage = $("#input-message").val().trim() + "<br>";
        database.ref(userMessagesPath).set({
            dateTime: todaysDate + " " + currentTime,
            email: userEmail,
            message: entryMessage,
            currentGeolocation: "Latitude: " + userLatitude +
                ", Longitude: " + userLongitude
        });
        $("#input-message").val("");
    });

    $("#send-link").on("click", function () {
        let theEmailAddressToSendLinkTo = prompt("Please enter the email address to send the link to:");
        if (theEmailAddressToSendLinkTo != null) {
            sendEmailLink(theEmailAddressToSendLinkTo);
        }
    });

    $("#test-only").on("click", function () {
        displayApplicationOrAuthentication();
        console.log(userSignedIn);
    });

    database.ref(userMessagesPath).on("value", function (snapshot) {
        let theMessageEmail = snapshot.child("users/" + userID + "/messages/email/").val();
        let theMessageMessage = snapshot.child("users/" + userID + "/messages/message/").val();
        let theMessageDateTime = snapshot.child("users/" + userID + "/messages/dateTime/").val();
        let theCurrentGeolocation = snapshot.child("users/" + userID + "/messages/currentGeolocation/").val();
        if (theMessageEmail != null) {
            $("#message-display").prepend("<span class='monospace'>" + theMessageDateTime + " <strong>" + theMessageEmail + "</strong>:</span> " + theMessageMessage);
            if (theCurrentGeolocation != "Latitude: undefined, Longitude: undefined") {
                geolocationListField.prepend(theMessageDateTime + " <strong>" + theMessageEmail + "</strong>: " + theCurrentGeolocation + "<br>");
            }
        }
    }, function (errorObject) {
        console.log("entries-error: " + errorObject.code);
    });

    function emptyInputFields() {
        $("#input-message").val("");
        $("#message-display").text("");
        $("#geolocation-list").text("");
        $("#map-display").text("");
    };

    $("#sign-out").click(function () {
        doSignOut();
        emptyInputFields();
    });

    emptyInputFields();

    //---------------------------------------------
    function toggleSignIn() {
        if (firebase.auth().currentUser) {
            //do signout
            doSignOut();
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
                console.log(error);
                document.getElementById("sign-in").disabled = false;
            });
        }
        document.getElementById("sign-in").disabled = true;
    }

    function doSignOut() {
        firebase.auth().signOut();
        database.ref(userUsersPath).set({
            email: userEmail,
            signedIn: false
        });
    };

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
            console.log(error);
        });
    }

    function sendEmailLink(theEmailAddress) {
        firebase.auth().sendSignInLinkToEmail(theEmailAddress, actionCodeSettings).then(function () {
            // Save the email locally so you don’t need to ask the user for it again if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', theEmailAddress);
            // The link was successfully sent. Inform the user.
            alert('An email was sent to ' + theEmailAddress + '. This instance can be accessed by anyone using the link in that email.');
            // [START_EXCLUDE]
            // Re-enable the sign-in button.
            document.getElementById("sign-in").disabled = false;
            // [END_EXCLUDE]
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            handleError(error);
        });
    }

    function handleSignIn() {
        if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
            // Disable the sign-in button during async sign-in tasks.
            document.getElementById("sign-in").disabled = true;
            // Get the email if available.
            var email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                // User opened the link on a different device. To prevent session fixation attacks, ask the
                // user to provide the associated email again. For example:
                email = window.prompt('Please provide the email you\'d like to sign-in with for confirmation.');
            }
            if (email) {
                firebase.auth().signInWithEmailLink(email, window.location.href).then(function (result) {
                    // Clear the URL to remove the sign-in link parameters.
                    if (history && history.replaceState) {
                        window.history.replaceState({}, document.title, window.location.href.split('?')[0]);
                    }
                    // Clear email from storage.
                    window.localStorage.removeItem('emailForSignIn');
                    var user = result.user;
                    var isNewUser = result.additionalUserInfo.isNewUser;
                    console.log(result)
                }).catch(function (error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    handleError(error);
                });
            }
        }
    }


    function handleError(error) {
        alert('Error: ' + error.message);
        console.log(error);
        document.getElementById("sign-in").disabled = false;
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
            console.log(error);
        });
    }

    //initializeDatabaseReferences handles setting up UI event listeners and registering Firebase auth listeners:
    function initializeDatabaseReferences() {
        // Restore the previously used value of the email.
        // var email = window.localStorage.getItem('emailForSignIn');
        // document.getElementById('email').value = email;

        // Automatically signs the user-in using the link.
        handleSignIn();

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                // User is signed in.
                userEmail = user.email;
                userID = user.uid;
                userSignedIn = true;
                userStatisticsPath = "users/" + userID + "/statistics";
                userUsersPath = "users/" + userID + "/info";
                userMessagesPath = "users/" + userID + "/messages";
                displayApplicationOrAuthentication();
                document.getElementById("sign-in").textContent = "Sign out";
                database.ref(userUsersPath).set({
                    email: userEmail,
                    signedIn: true
                });
                displayApplicationOrAuthentication();
                getLocation();
            } else {
                // User is signed out.
                userSignedIn = false;
                displayApplicationOrAuthentication();
                document.getElementById("sign-in").textContent = "Sign in";
            }
            document.getElementById("sign-in").disabled = false;
        });

        $(document.body).on("click", "#sign-in", function () {
            toggleSignIn();
        });
        $(document.body).on("click", "#create-account", function () {
            handleSignUp();
        });
        $(document.body).on("click", "#password-reset", function () {
            sendPasswordReset();
        });
    }
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

    //------------------------------------------------
    console.log("v1.57172");
});