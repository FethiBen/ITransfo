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
function isAuthenticated(req, res, next) {
	/*
	const sessionCookie = req.cookies.__session || '';
    admin.auth().verifySessionCookie(
	    sessionCookie, true).then((decodedClaims) => {
	    	admin.auth().getUser(decodedClaims.uid).then((userRecord) => {
			  // The claims can be accessed on the user record.
			  //console.log(userRecord.customClaims.admin);
			  res.locals.admin = userRecord.customClaims.admin;
			  res.locals.supervisor = userRecord.customClaims.supervisor;
			  return next();
			}).catch(error => {
				res.redirect('/');
			});
			return true;
	  }).catch(error => {
	    res.redirect('/');
	  });
	*/
	res.locals.admin = true;
	res.locals.supervisor = true;
	next()
	
}


var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())
// Attach CSRF token on each request.
//app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 100000000000000000).toString()));
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

/*admin.auth().setCustomUserClaims('JV4B09DOwvbmiYLzfdr9XOVN26q2', {admin: true, supervisor: true}).then(() => {
// The new custom claims will propagate to the user's ID token the
// next time a new one is issued.
// Update real-time database to notify client to force refresh.
        const metadataRef = admin.database().ref("metadata/JV4B09DOwvbmiYLzfdr9XOVN26q2" );
        // Set the refresh time to the current UTC timestamp.
        // This will be captured on the client to force a token refresh.
        console.log("done");
        return metadataRef.set({refreshTime: new Date().getTime()});
}).catch(error => {
        console.log(error);
      });

admin.auth().verifyIdToken(idToken).then((claims) => {
   if (claims.admin === true) {
     // Allow access to requested admin resource.
   }
 });

const customClaims = {
      admin: true,
      supervisor: true
    };
    // Set custom user claims on this newly created user.
    return admin.auth().setCustomUserClaims(user.uid, customClaims)
      .then(() => {
        // Update real-time database to notify client to force refresh.
        const metadataRef = admin.database().ref("metadata/" + user.uid);
        // Set the refresh time to the current UTC timestamp.
        // This will be captured on the client to force a token refresh.
        return metadataRef.set({refreshTime: new Date().getTime()});
      })
      .catch(error => {
        console.log(error);
      });

admin.auth().getUser(uid).then((userRecord) => {
  // The claims can be accessed on the user record.
  console.log(userRecord.customClaims.admin);
});
*/


// Whenever a user is accessing restricted content that requires authentication.
app.get('/dashboard/', isAuthenticated, (req, res) => {
	res.render('pages/dashboard', {css: "dashboard.css", js: "dashboard.js", current: "<i class='fas fa-home icon'></i> Dashboard", admin: res.locals.admin});
})

app.get('/transformer/', isAuthenticated, (req, res) => {
	res.render('pages/transformer', {css: "transformer.css", js: "transformer.js", current: '<i class="fas fa-bolt icon"></i> Transformer', admin: res.locals.admin});
});

app.get('/statistic/', isAuthenticated, (req, res) => {
	res.render('pages/statistic', {css: "statistic.css", js: "statistic.js", current: '<i class="fas fa-chart-line icon"></i> Statistic', admin: res.locals.admin});
});

app.get('/services/', isAuthenticated, (req, res) => {
	res.render('pages/services', {css: "services.css", js: "services.js", current: '<i class="fas fa-cogs icon"></i> Services', admin: res.locals.admin});
});

app.get('/products/', isAuthenticated, (req, res) => {
	res.render('pages/products', {css: "products.css", js: "products.js", current: '<i class="fas fa-cart-plus icon"></i> Products', admin: res.locals.admin});
});

app.get('/settings/', isAuthenticated, (req, res) => {
	res.render('pages/settings', {css: "settings.css", js: "settings.js", current: '<i class="fas fa-wrench icon"></i> Settings', admin: res.locals.admin});
});

app.get('/support/', isAuthenticated, (req, res) => {
	res.render('pages/support', {css: "support.css", js: "support.js", current: '<i class="fas fa-question-circle icon"></i> Support', admin: res.locals.admin});
});

app.get('/account/', isAuthenticated, (req, res) => {
	res.render('pages/account', {css: "account.css", js: "account.js", current: '<i class="fas fa-user"></i> Account', admin: res.locals.admin});
});

/*
** ---------------------------------------------------------------------
** 		Admin Panel 
*/

app.get('/console/', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		  res.render('pages/console', {css: "console.css", js: "console.js", current: '<i class="fas fa-home ad-icon"></i> Admin Console', admin: res.locals.admin});

	}
	else {
		res.redirect("/");
	}
});

app.get('/console/itransfo', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		res.render('pages/itransfo', {css: "itransfo.css", js: "itransfo.js", current: '<i class="fas fa-bolt ad-icon"></i> ITransfo', admin: res.locals.admin});

	}
	else {
		res.redirect("/");
	}
});

app.get('/console/clients', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		  res.render('pages/clients', {css: "clients.css", js: "clients.js", current: '<i class="fas fa-users ad-icon"></i> Clients', admin: res.locals.admin});
	}
	else {
		res.redirect("/");
	}
});

app.get('/console/linkproducts', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		  res.render('pages/linkproducts', {css: "linkproducts.css", js: "linkproducts.js", current: '<i class="fas fa-plus-circle ad-icon"></i> Link Products', admin: res.locals.admin});
	}
	else {
		res.redirect("/");
	}

});

app.get('/console/settings', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		res.render('pages/adSettings', {css: "adSettings.css", js: "adSettings.js", current: '<i class="fas fa-wrench ad-icon"></i> Settings', admin: res.locals.admin});
	}
	else {
		res.redirect("/");
	}
  
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