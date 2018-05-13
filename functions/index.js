const admin = require('firebase-admin');
const functions = require('firebase-functions');
var FieldValue = require('firebase-admin').firestore.FieldValue;


var serviceAccount = require("./itransfo-3252d-firebase-adminsdk-5noab-010e875d04.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://itransfo-3252d.firebaseio.com"
});

//admin.initializeApp(functions.config().firebase);

var db = admin.firestore();
/* --------------------------------------------------------------------- */

var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var cookieParser = require('cookie-parser')
var path = require('path');
var moment = require('moment');
var time = moment()
/* --------------------------------------------------------------------- */

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
/*admin.auth().getUser(decodedClaims.uid).then((userRecord) => {
  // The claims can be accessed on the user record.
  //console.log(userRecord.customClaims.admin);
  res.locals.uid = userRecord.uid || '';
  res.locals.admin = userRecord.customClaims.admin || '';
  res.locals.supervisor = userRecord.customClaims.supervisor || '';
  return next();
}).catch(error => {
	res.redirect('/');
});
*/
function isAuthenticated(req, res, next) {
	
	const sessionCookie = req.cookies.__session || '';
    admin.auth().verifySessionCookie(
	    sessionCookie, true).then((decodedClaims) => {
			res.locals.admin = (decodedClaims.admin.toString() === 'true')? true: false;
			res.locals.supervisor = (decodedClaims.supervisor.toString() === 'true')? true: false;
			return next();
	  }).catch(error => {
	    res.redirect('/');
	  });
	/*
	res.locals.admin = true;
	res.locals.supervisor = true;
	next();
	*/
}
/* --------------------------------------------------------------------- */

var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true, inflate: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());

// Attach CSRF token on each request.
app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 100000000000000000).toString()));
// If a user is signed in, redirect to profile page.
app.use(checkIfSignedIn('/'));

//res.setHeader('Content-Type', 'application/json');
//res.send(JSON.stringify({ a: 1 }, null, 3));
/* --------------------------------------------------------------------- */

app.get('/', (req, res) => {
	res.render('pages/index');
})
/* --------------------------------------------------------------------- */
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
		  'uid': userRecord.uid,
		  'appToken': '',
		  'company': '',
		  'admin': 'false',
		  'supervisor': 'false',
		  'disabled': 'false'
		});
		
	    res.send("signedUp");
	    return true;
	})
	.catch((error) => {
	    res.send("error");
	});
})
/* --------------------------------------------------------------------- */
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
  	res.send(JSON.stringify({status: 'success'}));
  	return res;
  }).catch(error => {
    res.status(403).send('UNAUTHORIZED REQUEST!');
  });

});
/* --------------------------------------------------------------------- */
/*
admin.auth().setCustomUserClaims('JV4B09DOwvbmiYLzfdr9XOVN26q2', {admin: true, supervisor: true}).then(() => {
// The new custom claims will propagate to the user's ID token the
// next time a new one is issued.
// Update real-time database to notify client to force refresh.
        //const metadataRef = admin.database().ref("metadata/JV4B09DOwvbmiYLzfdr9XOVN26q2" );
        // Set the refresh time to the current UTC timestamp.
        // This will be captured on the client to force a token refresh.
        console.log("done");
        return true;//metadataRef.set({refreshTime: new Date().getTime()});
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
/* --------------------------------------------------------------------- */

// Whenever a user is accessing restricted content that requires authentication.
app.get('/dashboard/', isAuthenticated, (req, res) => {
	res.render('pages/dashboard', {admin: res.locals.admin});
})
app.post('/dashboard/', isAuthenticated, (req, res) => {
	res.render('templates/dashboard');
})
/* --------------------------------------------------------------------- */
app.post('/transformer/', isAuthenticated, (req, res) => {
	res.render('templates/transformer');
});
/* --------------------------------------------------------------------- */
app.post('/statistic/', isAuthenticated, (req, res) => {
	res.render('templates/statistic');
});
/* --------------------------------------------------------------------- */
app.post('/services/', isAuthenticated, (req, res) => {
	res.render('templates/services');
});
/* --------------------------------------------------------------------- */
app.post('/products/', isAuthenticated, (req, res) => {
	res.render('templates/products');
});
/* --------------------------------------------------------------------- */
app.post('/settings/', isAuthenticated, (req, res) => {
	res.render('templates/settings');
});
/* --------------------------------------------------------------------- */
app.post('/support/', isAuthenticated, (req, res) => {
	res.render('templates/support');
});
/* --------------------------------------------------------------------- */
app.post('/account/', isAuthenticated, (req, res) => {
	res.render('templates/account');
});


/* --------------------------------------------------------------------- */
/*
**
		App URL Requests


/*
*
*	Receive data from device
*
/* --------------------------------------------------------------------- */
/*
app.post('/setdata/', upload.array(), (req, res) => {
		console.log(req.body.device_uid);
		return res.status(200).send("done");

});

/**		Set User Notification Token
**
*/
/*
app.post('/setToken/', upload.array(), (req, res) => {
	var user = db.collection('users').doc(String(req.body.client_uid))
		user.update({
			'appToken': req.body.tokenId
		});
	return res.status(200).send("done");
})


app.post('/getUserDevices/', upload.array(), (req, res) => {
	var d = []

	db.collection('devices').where('clients.'+req.body.client_uid, '==', 'true').get().then(docs => {
		docs.forEach(function(doc) {
			d.push(doc.data())
		})

    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d);
	}).catch(error => {
		console.log(error)
		return res.status(403).send('Could Not Get Devices');
	})
	
})
*/
/* --------------------------------------------------------------------- */
/*
** 
** 		Admin Panel 
** 
*/
/* --------------------------------------------------------------------- */

/* --------------------------------------------------------------------- */
app.post('/console/', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		  res.render('templates/console');

	}
	else {
		res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* --------------------------------------------------------------------- */
app.post('/console/devices', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		return res.render('templates/devices');

	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}

});
app.post('/console/adddevice', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		var device = db.collection('devices').doc(String(req.body.device_ref));
		device.set({
			'company_name': req.body.company_name,
			'device_name': req.body.device_name,
			'device_ref' : req.body.device_ref,
			'device_uid': req.body.device_uid
		});
		return res.status(200).send("done");
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
app.post('/console/getdevices', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		db.collection('devices').get().then(devices => {
			var d = [];
			devices.forEach(doc => {
		        d.push(doc.data());
		      });

			res.setHeader('Content-Type', 'application/json');
			return res.status(200).json(d);
		}).catch(error => {
			return res.status(400).send('error');
		});
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
/* --------------------------------------------------------------------- */
app.post('/console/clients', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		return res.render('templates/clients');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
app.post('/console/getclients', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		db.collection('users').get().then(users => {
			var u = [];
			users.forEach(doc => {
		        u.push(doc.data());
		      });

			res.setHeader('Content-Type', 'application/json');
			return res.status(200).json(u);
		}).catch(error => {
			return res.status(400).send('error');
		});
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
app.post('/console/setadminclaims', isAuthenticated, upload.array(), (req, res) => {
	if(req.body.uid === 'JV4B09DOwvbmiYLzfdr9XOVN26q2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}
	admin.auth().setCustomUserClaims(req.body.uid, {admin: req.body.admin}).then(() => {
		        db.collection('users').doc(req.body.uid).update({admin: req.body.admin});
		        return res.status(200).send("done");
	}).catch(error => {
		return res.status(401).send("error");
	});
})
app.post('/console/setsupervisorclaims', isAuthenticated, upload.array(), (req, res) => {
	if(req.body.uid === 'JV4B09DOwvbmiYLzfdr9XOVN26q2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}
	admin.auth().setCustomUserClaims(req.body.uid, {supervisor: req.body.supervisor}).then(() => {
		        db.collection('users').doc(req.body.uid).update({supervisor: req.body.supervisor});
		        return res.status(200).send("done");
	}).catch(error => {
		return res.status(401).send("error");
	});
})
app.post('/console/disable', isAuthenticated, upload.array(), (req, res) => {
	if(req.body.uid === 'JV4B09DOwvbmiYLzfdr9XOVN26q2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}
	admin.auth().updateUser(req.body.uid, {
	  disabled: true
	})
	  .then((userRecord) => {
	  	db.collection('users').doc(req.body.uid).update({disabled: 'true'});
	    return res.status(200).send("done");
	  })
	  .catch((error) => {
	    return res.status(401).send("error");
	  });
})
app.post('/console/updateclient', isAuthenticated, upload.array(), (req, res) => {
	if(req.body.uid === 'JV4B09DOwvbmiYLzfdr9XOVN26q2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}
	admin.auth().updateUser(req.body.uid, {
	  email: "modifiedUser@example.com",
	  phoneNumber: "+11234567890",
	  emailVerified: true,
	  password: "newPassword",
	  displayName: "Jane Doe",
	  photoURL: "http://www.example.com/12345678/photo.png",
	  disabled: true
	})
	  .then((userRecord) => {
	    return res.status(200).send("done");
	  })
	  .catch((error) => {
	    return res.status(401).send("error");
	  });
})
/* --------------------------------------------------------------------- */
app.post('/console/linkproducts', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		return res.render('templates/linkproducts');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}

});
app.post('/console/addlink', isAuthenticated, upload.array(), (req, res) => {
	var uid = req.body.client_uid;
	if(res.locals.admin) {
		db.collection('linked_devices').where('device_ref', '==', req.body.device_ref )
			.where('client_uid', '==', req.body.client_uid)
			.get().then(docs => {
				var temp = true;
				docs.forEach(doc => {
					temp = false
					return res.status(403).send('Device already linked!').end();
				})
				
				if(temp) {
					db.collection('linked_devices').add({
						'device_ref' : req.body.device_ref,
						'client_uid': req.body.client_uid,
						'timestamp': time.format('YYYY-MM-DD HH:mm:ss')
					}).then( ref => {
						return res.status(200).send("done");
					}).catch(error => {
						return res.status(403).send('Could not add data');
					});
				}
				
				return true;
			}).catch(error => {
				return res.status(403).send('Could not add data');
			});
		
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
app.post('/console/getproducts', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		db.collection('linked_devices').get().then(devices => {
			var l = [];
			devices.forEach(doc => {
				var dic = doc.data();
				dic['docID'] = doc.id;
		        l.push(dic);
		      });

			res.setHeader('Content-Type', 'application/json');
			return res.status(200).json(l);
		}).catch(error => {
			return res.status(400).send({msg: 'Could not get Data', error: error});
		});
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
app.post('/console/updateproduct', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
app.post('/console/deletelink', isAuthenticated, upload.array(), (req, res) => {
	if(res.locals.admin) {
		db.collection('linked_devices').doc(req.body.docID).delete().then(doc => {
			return res.status(200).send("done");
		}).catch(error => {
			return res.status(403).send('Could not delete link');
		});
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
/* --------------------------------------------------------------------- */
app.post('/console/settings', isAuthenticated, (req, res) => {
	if(res.locals.admin) {
		return res.render('templates/adSettings');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
  
});
/* --------------------------------------------------------------------- */
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
/* --------------------------------------------------------------------- */

// 404 page not found
app.get('**', (req, res) => {
	return res.render('pages/404');
})
/* --------------------------------------------------------------------- */

exports.app = functions.https.onRequest(app);