let db = {
  users: [
    {
      userId: "1111111111",
      email: "user@gmail.com",
      handle: "user",
      createdAt: "2020-07-02T19:30:21.129Z",
      imageUrl: "image/dsadasd/dasda",
      bio: "Hello, my name is user, nice to meet you",
      website: " https://user.com",
      location: " london,UK",
    },
  ],
  screams: [
    {
      userHandle: "user",
      body: "Scream body",
      createdAt: "2020-07-02T19:30:21.129Z",
      likeCount: 5,
      commentCount: 2,
    },
  ],
  comments: [
    {
      userHandle: "user",
      screamId: "akjsdkajsdkjasdjk",
      body: "comment .... ",
      createdAt: "2020-07-02T19:30:21.129Z",
    },
  ],
};

const userDetails = {
  //Redux data in Front-End
  credentials: {
    userId: "1111111111",
    email: "user@gmail.com",
    handle: "user",
    createdAt: "2020-07-02T19:30:21.129Z",
    imageUrl: "image/dsadasd/dasda",
    bio: "Hello, my name is user, nice to meet you",
    website: " https://user.com",
    location: " london,UK",
  },
  likes: [
    {
      userHandle: "user",
      screamId: "askdaksjdiqweiqwe",
    },
    {
      userHandle: "user",
      screamId: "mnxczmnqweqwopepo",
    },
  ],
};
