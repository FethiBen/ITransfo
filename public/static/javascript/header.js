var sideNavWidth;
$(document ).ready(function() {
  sideNavWidth = $(".sidenav").css("width");
      // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
    // [END_EXCLUDE]
    if (user) {
      // User is signed in.
      //window.location.replace("/dashboard/");
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      $("#profile-menu #username").text(displayName);
      $("#profile-menu #useremail").text(email);
      // [START_EXCLUDE]
      if (!emailVerified) {
        sendEmailVerification();
        console.log("not verified");
        $("#alert").show();
      }
      // [END_EXCLUDE]
    } else {
      // User is signed out.
      console.log("signed out");
    }
  });
  // [END authstatelistener]
/* --------------------------------------------------------------- */

  $("#my-admin").hover(function() {
    $("#admin-angle-down").show();
  }, function() {
    $("#admin-angle-down").hide();
  });
});

function hideEmailnotfy() {
  $("#alert").hide();
}

function profileMenu() {
  $("#profile-menu").toggle();
}

function signOut() {
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    window.location.replace("/signout/");
  }).catch(function(error) {
    // An error happened.
  });
}
  /**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
  // [START sendemailverification]
  firebase.auth().currentUser.sendEmailVerification().then(function() {
    // Email Verification sent!
    // [START_EXCLUDE]
    alert("Verification email sent!");
    return true;
    // [END_EXCLUDE]
  });
  // [END sendemailverification]
}

function sideMenuToggle() {
  if(parseInt($(".sidenav").css("width")) > 0) {
    $(".sidenav").css({"width":"0%"});
    $(".navbar").css({"left":"0%", "width": "100%"});
    $("section").css({"margin-left":"0%", "width": "100%"});
  }
  else {
    $(".sidenav").css({"width":sideNavWidth});
    $(".navbar").css({"left":sideNavWidth, "width": String(parseInt(window.innerWidth)- parseInt(sideNavWidth))});
    $("section").css({"margin-left":sideNavWidth, "width": String(parseInt(window.innerWidth)- parseInt(sideNavWidth))});
  }
}

