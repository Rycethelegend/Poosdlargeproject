const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create express server and policy
const app = express();
app.use(cors());
app.use(bodyParser);

// Load API
var api = require('./api.js');
api.setApp( app, client );

// Connect to MongoDB
require('dotenv').config();
const url = process.env.MONGODB_URI;

import { MongoClient } from 'mongodb';

const client = new MongoClient(url);

// const Username = "PoosdDB_User";
// const Password = "BGqVpIHdmmpZjkWP";
// const name = "Alice";
// const greeting = `Hello, ${name}!`;

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
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
    await client.close();
    console.log("Connection closed.");
}

// mongodb+srv://<db_username>:<db_password>@poosdbase.puafigd.mongodb.net/
// Add this to the bottom of server.js to actually run the code

connectToMongoDB();

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

app.listen(5000); // start Node + Express server on port 5000