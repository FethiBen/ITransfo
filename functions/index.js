const functions = require('firebase-functions');
const firebase = require('firebase-admin');
var express = require('express');
var path = require('path');

var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

const firebaseApp = firebase.initializeApp(
		functions.config().firebase
	);


//res.setHeader('Content-Type', 'application/json');
//res.send(JSON.stringify({ a: 1 }, null, 3));

app.get('/', (req, res) => {
	res.render('pages/index');
})

app.post('/login', (req, res) => {

})

app.get('/set/:id', (req, res) => {
	console.log(req.param('id'));
	res.redirect('/');
})

app.get('/dashboard', (req, res) => {
	res.render('pages/dashboard');
})

// 404 page not found
app.get('**', (req, res) => {
	res.render('pages/404');
})

exports.app = functions.https.onRequest(app);