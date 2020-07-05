/**
 * BASE ROUTES
 */
const functions = require("firebase-functions");

const app = require("express")();
const {
  getAllScreams,
  postScream,
  getScream,
  commentOnScream,
} = require("./handlers/screams.js");
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require("./handlers/users.js");
const fbAuth = require("./utils/fbAuth.js");

// Screams Routes
app.get("/screams", getAllScreams);
app.post("/scream", fbAuth, postScream);
app.get("/scream/:screamId", getScream);
app.post("/scream/:screamId/comment", fbAuth, commentOnScream);
//TODO: delete a scream
//TODO: like a scream
//TODO: unlike a scream

//Users Routes
app.post("/signup", signUp);
app.post("/login", login);
app.post("/user/image", fbAuth, uploadImage);
app.post("/user", fbAuth, addUserDetails);
app.get("/user", fbAuth, getAuthenticatedUser);

exports.api = functions.region("europe-west1").https.onRequest(app);
