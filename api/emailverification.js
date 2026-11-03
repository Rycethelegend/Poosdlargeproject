const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const url = require("dotenv").config;
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function EmailVerification(){
    const client = new MongoClient(process.env);

    await client.connect();

    const database = client.db("PoosdDatabase");
    await database.command({ping: 1});

}