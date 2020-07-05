const { db, admin } = require("../utils/admin.js");
const firebase = require("firebase");
const { appConfig } = require("../appAccount.js");

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../utils/validators.js");
const { response, request } = require("express");

firebase.initializeApp(appConfig);

//Sign Up Users
exports.signUp = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return response.status(400).json(errors);

  const noImg = "blank-profile.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${noImg}/o/${noImg}?alt=media`,
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
        return response
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

//Login for Users
exports.login = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password,
  };

  const { valid, errors } = validateLoginData(user);
  if (!valid) return response.status(400).json(errors);

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
      return response
        .status(403)
        .json({ general: "Wrong credentials,please try again" });
    });
};

//Add User Details
exports.addUserDetails = (request, response) => {
  let userDetails = reduceUserDetails(request.body);
  db.doc(`/users/${request.user.handle}`) //because of fbAuth we have access to user
    .update(userDetails)
    .then(() => {
      return response.json({ message: "Details added successfully" });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

//Get own user details
exports.getAuthenticatedUser = (request, response) => {
  let userData = {};
  db.doc(`/users/${request.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credetials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", request.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", request.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          type: doc.data().type,
          read: doc.data().read,
          screamId: doc.data().screamId,
          notificationId: doc.data().id,
        });
      });
      return response.json(userData);
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.getUserDetails = (request, response) => {
  let userData = {};
  db.doc(`/users/${request.params.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection("screams")
          .where("userHandle", "==", request.params.handle)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return response.status(404).json({ error: "user not found" });
      }
    })
    .then((data) => {
      userData.screams = [];
      data.forEach((doc) => {
        userData.screams.push({
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          createdAt: doc.data().createdAt,
          screamId: doc.id,
        });
      });
      return response.json(userData);
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

exports.markNotificationsRead = (request, response) => {
  let batch = db.batch();
  request.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return response.json({ message: "Notification marked read" });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

//Upload a Profile Image for User
exports.uploadImage = (request, response) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs"); // File System

  const busboy = new BusBoy({ headers: request.headers });
  let imageFileName,
    imageToBeUploaded = {};

  //`file` event for file upload
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return response.status(400).json({ error: "Wrong file type submitted" });
    }
    //we need to extract the .png , .jpg, ....
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000
    )}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${appConfig.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${request.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return response.json({ message: "Image uploaded successfully" });
      })
      .catch((error) => {
        console.error(error);
        return response.status(500).json({ error: error.code });
      });
  });
  busboy.end(request.rawBody);
};
