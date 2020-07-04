const { response } = require("express");

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
