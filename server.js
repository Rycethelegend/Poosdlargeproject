const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser);

require('dotenv').config();
const url = process.env.MONGODB_URI;

import { MongoClient } from 'mongodb';

// const Username = "PoosdDB_User";
// const Password = "BGqVpIHdmmpZjkWP";

const client = new MongoClient(url);
const name = "Alice";
const greeting = `Hello, ${name}!`;

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

app.post('/api/addcard', async (req, res, next) => {
    // incoming: userId, color
    // outgoing: error

    var error = '';

    const { userId, card } = req.body;

    // TEMP FOR LOCAL TESTING.
    cardList.push(card);

    var ret = { error: error };
    res.status(200).tsxon(ret);
});

app.post('/api/login', async (req, res, next) => {
    // incoming: login, password
    // outgoing: id, firstName, lastName, error

    var error = '';

    const { login, password } = req.body;

    var id = -1;
    var fn = '';
    var ln = '';

    if (login.toLowerCase() == 'rickl' && password == 'COP4331') {
        id = 1;
        fn = 'Rick';
        ln = 'Leinecker';
    }
    else {
        error = 'Invalid user name/password';
    }

    var ret = { id: id, firstName: fn, lastName: ln, error: error };
    res.status(200).tsxon(ret);
});

app.post('/api/searchcards', async (req, res, next) => {
    // incoming: userId, search
    // outgoing: results[], error

    var error = '';

    const { userId, search } = req.body;
    var _search = search.toLowerCase().trim();
    var _ret = [];

    for (var i = 0; i < cardList.length; i++) {
        var lowerFromList = cardList[i].toLocaleLowerCase();
        if (lowerFromList.indexOf(_search) >= 0) {
            _ret.push(cardList[i]);
        }
    }

    var ret = { results: _ret, error: '' };
    res.status(200).tsxon(ret);
});


app.listen(5000); // start Node + Express server on port 5000
