const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Get mongo URL from .env: DATABASE_LINK, or MONGODB_URI (the older name)
require('dotenv').config();
const url = process.env.DATABASE_LINK || process.env.MONGODB_URI;

// Our collections (Users, Leaderboard, VerificationCodes) live in this database.
// Set here so it doesn't matter whether the connection string names one.
const DB_NAME = 'PoosdDatabase';

// Create express server and policy
const app = express();
app.use(cors());

// For some reason, app.use(bodyParser.json()) works better than app.use(bodyParser))
app.use(bodyParser.json());

// Connect to MongoDB
const mongoose = require('mongoose');

////const { MongoClient } = require('mongodb')

//const client = new MongoClient(url);

// const Username = "###########";
// const Password = "###########";
// const name = "###########";
// const greeting = `Hello, ${name}!`;

/* This function inserts random info. Going to modify this.
export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");

        const database = client.db("PoosdDatabase");
        const usersCollection = database.collection("Users");

        //Define the new user data (document) you want to insert
        const newUser = {
            _id: "user123", // You can use a unique identifier
            email: "alice@example.com",
            username: "aliceMan",
            password: "securePassword123",
            highscore: 0
            //createdAt: new Date()
        };

        //now insert user
        const result = await usersCollection.insertOne(newUser);
        console.log(`Success! New user created with _id: ${result.insertedId}`);

        return client;
    } catch (err) {
        console.dir(err);
    } finally {
        disconnectFromMongoDB()
    }
}*/

/* CAUSING PROBLEMS
// Call this only when your application terminates
export async function disconnectFromMongoDB() {
    await client.close();
    console.log("Connection closed.");
}*/

// OLD CODE:
// mongodb+srv://<db_username>:<db_password>@poosdbase.puafigd.mongodb.net/
// Add this to the bottom of server.js to actually run the code
// connectToMongoDB();


// In the mean time, this function has better syntax anyways.
//client.connect()
//    .then(() => console.log('MongoDB connected'))
//    .catch(err => console.error('MongoDB connection failed:', err.message));

// Headers - DONT EDIT
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

// Load API - Must come after mongoDB connection and app.setHeaders
var api = require('./api.js');

// Connect first, then load the API and start the server. api.js uses
// mongoose.connection.db, which only exists once the connection is open;
// loading it any earlier crashes the server on startup.
mongoose.connect(url, { dbName: DB_NAME })
  .then(() => {
      console.log('MongoDB connected successfully via Mongoose');
      api.setApp( app, mongoose );
      app.listen(5000, () => console.log('API listening on port 5000')); // start Node + Express server on port 5000
  })
  .catch(err => {
      console.error('MongoDB connection failed:', err.message);
      if (!url) console.error('Set DATABASE_LINK (or MONGODB_URI) in .env to the MongoDB connection string.');
      process.exit(1);
  });