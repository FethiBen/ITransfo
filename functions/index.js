const admin = require('firebase-admin');
const functions = require('firebase-functions');

var serviceAccount = require("./itransfo-3252d-firebase-adminsdk-5noab-010e875d04.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://itransfo-3252d.firebaseio.com"
});

//admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var cookieParser = require('cookie-parser')
var path = require('path');

function checkIfSignedIn(url) {
  return function(req, res, next) {
    if (req.url === url) {
      var sessionCookie = req.cookies.__session || '';
      // User already logged in. Redirect to profile page.
      admin.auth().verifySessionCookie(sessionCookie, true).then((decodedClaims) => {
        return res.redirect('/dashboard/');
      }).catch((error) => {
        next();
      });
    } else {
      return next();
    }
  }
}
function attachCsrfToken(url, cookie, value) {
  return function(req, res, next) {
    if (req.url === url) {
      res.cookie(cookie, value);
    }
    next();
  }
}


var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())
// Attach CSRF token on each request.
app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 100000000000000000).toString()));
// If a user is signed in, redirect to profile page.
app.use(checkIfSignedIn('/'));

//res.setHeader('Content-Type', 'application/json');
//res.send(JSON.stringify({ a: 1 }, null, 3));

app.get('/', (req, res) => {
	res.render('pages/index');
})

app.post('/signup/', upload.array(), (req, res) => {
	admin.auth().createUser({
	  email: req.body.email,
	  emailVerified: false,
	  password: req.body.password,
	  displayName: req.body.username,
	  disabled: false
	}).catch((error) => {
		res.send("error");
	})
	.then((userRecord) => {
	    // See the UserRecord reference doc for the contents of userRecord.
	    var user = db.collection('users').doc(String(userRecord.uid));
		var newUser = user.set({
		  'firstname': req.body.firstname,
		  'lastname': req.body.lastname,
		  'username': req.body.username,
		  'email': req.body.email,
		  'admin': false,
		  'uid': userRecord.uid
		});
		
	    res.send("signedUp");
	    return true;
	})
	.catch((error) => {
	    res.send("error");
	});
})


app.post('/sessionLogin/', upload.array(), (req, res) => {
  // Get the ID token passed and the CS0RF token.
  var idToken = String(req.body.idToken);
  var csrfToken = String(req.body.csrfToken);
  
  // Guard against CSRF attacks.
  if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
    res.status(401).send('UNAUTHORIZED REQUEST!');
    return;
}
  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  admin.auth().createSessionCookie(idToken, {expiresIn})
  .then((sessionCookie) => {
    // Set cookie policy for session cookie.
    const options = {maxAge: expiresIn, httpOnly: true, secure: true};
    res.cookie('__session', sessionCookie, options);
    //res.send(JSON.stringify({status: 'success' ,cookie: "__session="+sessionCookie+";expires="+expiresIn+";secure=true;httpOnly:true"}));
  	res.send(JSON.stringify({status: 'success'}));
  	return res;
  }).catch(error => {
    res.status(403).send('UNAUTHORIZED REQUEST!');
  });

});


app.get('/set/:id', (req, res) => {
	console.log(req.params.id);
	res.status(403).send('Unauthorized');
	//res.redirect('/');
})

app.get('/dashboard/', (req, res) => {
	const sessionCookie = req.cookies.__session || '';
    admin.auth().verifySessionCookie(
    sessionCookie, true /** checkRevoked */).then((decodedClaims) => {
    	res.render('pages/dashboard', {username: "medyas"});
    	return true;
  }).catch(error => {
    res.redirect('/');
  });
})

// Whenever a user is accessing restricted content that requires authentication.
app.get('/profile/', (req, res) => {
  const sessionCookie = req.cookies.__session || '';
  admin.auth().verifySessionCookie(
    sessionCookie, true /** checkRevoked */).then((decodedClaims) => {
    res.send(decodedClaims.uid);
    return true;
  }).catch(error => {
    //res.redirect('/');
    res.redirect('/');
  });
});


app.get('/signout/', (req, res) => {
  // Clear cookie.
  var sessionCookie = req.cookies.__session || '';
  res.clearCookie('session');
  // Revoke session too. Note this will revoke all user sessions.
  if (sessionCookie) {
    admin.auth().verifySessionCookie(sessionCookie, true).then((decodedClaims) =>{
      return admin.auth().revokeRefreshTokens(decodedClaims.sub);
    })
    .then(() => {
      // Redirect to login page on success.
      return res.redirect('/');
    })
    .catch(() => {
      // Redirect to login page on error.
      res.redirect('/');
    });
  } else {
    // Redirect to login page when no session cookie available.
    res.redirect('/');
}
});


// 404 page not found
app.get('**', (req, res) => {
	res.render('pages/404');
})

exports.app = functions.https.onRequest(app);