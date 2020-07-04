/**
 * BASE ROUTES
 */
const functions = require("firebase-functions");

const app = require("express")();
const { getAllScreams, postScream } = require("./handlers/screams.js");
const { signUp, login } = require("./handlers/users.js");
const fbAuth = require("./utils/fbAuth.js");

// Screams Routes
app.get("/screams", getAllScreams);
app.post("/scream", fbAuth, postScream);

//Users Routes
app.post("/signup", signUp);
app.post("/login", login);

exports.api = functions.region("europe-west1").https.onRequest(app);
