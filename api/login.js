//let http = require('http');
const express = require('express');
const MongoClient = require("mongodb").MongoClient;
const url = require("dotenv").config;
const app = express();
const PORT = process.env.PORT || 5000 || "http://00.00.000.000"; //

app.use(cors());
app.use(express.json());


async function Login() {

    const client = new MongoClient(process.env);

    await client.connect();
    const database = client.db("PoosdDatabase");
    await database.command({ping: 1});
    
    //const userName = database.collection("Username");

    app.post("/login", async (req, res) => {
        const username = req.body;
        const password = req.body;


        if (!username || !password) {
            res.status(400).json({
                error: "Missing parameter",
                message: "Invalid username or password."
            });
        }
    });
    try {

    }

    catch {

    }
}

//email verification

//password reset
