const { response, request } = require("express");

const { db } = require("../utils/admin.js");

exports.getAllScreams = (request, response) => {
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
};

exports.postScream = (request, response) => {
  if (request.body.body.trim() === "")
    return response.status(400).json({ body: "Body must not be empty" });

  const newScream = {
    body: request.body.body,
    userHandle: request.user.handle,
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
};

//Fetch one scream
exports.getScream = (request, response) => {
  let screamData = {};
  db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection(`comments`)
        .orderBy("createdAt", "desc")
        .where("screamId", "==", request.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return response.json(screamData);
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};

//comment on scream
exports.commentOnScream = (request, response) => {
  if (request.body.body.trim() === "")
    return response.status(400).json({ error: "Must not be empty" });

  const newComment = {
    body: request.body.body,
    createdAt: new Date().toISOString(),
    screamId: request.params.screamId,
    userHandle: request.user.handle,
    userImage: request.user.imageUrl,
  };

  db.doc(`/screams/${request.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Scream not found" });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return response.json({ message: `Comment added successfully` });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).json({ error: error.code });
    });
};
