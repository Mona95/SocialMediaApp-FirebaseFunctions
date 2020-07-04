const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");

var serviceAccount = require("./serviceAccount.json");
const app = require("express")();

//because some functions need access to database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialmedia-5d09b.firebaseio.com",
});

var config = require("./appAccount.json");
const { response, request } = require("express");
firebase.initializeApp(config);

const db = admin.firestore();

app.get("/screams", (request, response) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });
      return response.json(screams);
    })
    .catch((error) => console.error(error));
});

app.post("/scream", (request, response) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.body.userHandle,
    createdAt: new Date().toISOString(),
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      response.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((error) => {
      response.status(500).json({ error: "something went wrong" });
      console.error(error);
    });
});

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

const isEmail = (email) => {
  let regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

//Sign Up route
app.post("/signup", (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

  //Error Validation
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match.";
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response
          .status(400)
          .json({ handle: `this handle is already taken.` });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentioals = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      db.doc(`/users/${newUser.handle}`).set(userCredentioals);
    })
    .then((data) => {
      return response.status(201).json({ token });
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        return response.status(400).json({ error: `Email is already in use.` });
      } else {
        return response.status(500).json({ error: error.code });
      }
    });
});

app.post("/login", (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password,
  };

  let errors = {};
  if (isEmpty(user.email)) errors.email = "Must not be empty";
  if (isEmpty(user.password)) errors.password = "Must not be empty";
  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return response.json({ token });
    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/wrong-password")
        return response
          .status(403)
          .json({ general: "Wrong credentials,please try again" });
      else return response.status(500).json({ error: error.code });
    });
});

exports.api = functions.region("europe-west1").https.onRequest(app);
