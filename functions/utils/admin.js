const admin = require("firebase-admin");
var serviceAccount = require("../serviceAccount.json");

//because some functions need access to database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialmedia-5d09b.firebaseio.com",
  storageBucket: "socialmedia-5d09b.appspot.com",
});

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
