const admin = require('firebase-admin');
const functions = require('firebase-functions');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var cookieParser = require('cookie-parser')
var path = require('path');

var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

var serviceAccount = require("./itransfo-3252d-firebase-adminsdk-5noab-010e875d04.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://itransfo-3252d.firebaseio.com"
});

//admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

validateFirebaseIdToken = (req, res) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !req.cookies.session) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized-1');
    return false;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.session;
  }
  admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    return true;
  }).catch((error) => {
    console.error('Error while verifying Firebase ID token:', error);
    //res.status(403).send('Unauthorized');
    return false;
  });
};
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
	}).catch(function(error) {
		res.send("error");
	})
	.then(function(userRecord) {
	    // See the UserRecord reference doc for the contents of userRecord.
	    console.log("Successfully created new user:", userRecord.uid);
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
	})
	.catch(function(error) {
	    console.log("Error creating new user:", error);
	    res.send("error");
	});

	//console.log(req.body);
})


app.post('/sessionLogin/', upload.array(), (req, res) => {
  // Get the ID token passed and the CSRF token.
  const idToken = req.body.idToken.toString();

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  admin.auth().createSessionCookie(idToken, {expiresIn}).then((sessionCookie) => {
    // Set cookie policy for session cookie.
    const options = {maxAge: expiresIn, httpOnly: true, secure: true};
    res.cookie('session', sessionCookie, options);
    res.send(JSON.stringify({status: 'success' ,cookie: "session="+sessionCookie+";expires="+expiresIn+"secure=true;httpOnly:true"}));
  }, error => {
    res.status(401).send('UNAUTHORIZED REQUEST!');
  });

});


app.get('/set/:id', (req, res) => {
	console.log(req.params.id);
	if(validateFirebaseIdToken(req, res)) {
		res.render('pages/dashboard', {username: req.params.id});
	}
	res.status(403).send('Unauthorized');
	//res.redirect('/');
})

app.get('/dashboard/', (req, res) => {
	console.log(req.cookies);//JSON.stringify(req.headers));
	if(validateFirebaseIdToken(req, res)) {
		res.render('pages/dashboard', {username: "medyas"});
	}
})

// Whenever a user is accessing restricted content that requires authentication.
app.get('/profile', (req, res) => {
  const sessionCookie = req.cookies.session || '';
  // Verify the session cookie. In this case an additional check is added to detect
  // if the user's Firebase session was revoked, user deleted/disabled, etc.
  admin.auth().verifySessionCookie(
    sessionCookie, true /** checkRevoked */).then((decodedClaims) => {
    //serveContentForUser('/profile', req, res, decodedClaims);
    res.send("Valid");
  }).catch(error => {
    // Session cookie is unavailable or invalid. Force user to login.
    //res.redirect('/');
    res.send("Not Valid");
  });
});


app.post('/signout/', (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});


// 404 page not found
app.get('**', (req, res) => {
	res.render('pages/404');
})

exports.app = functions.https.onRequest(app);