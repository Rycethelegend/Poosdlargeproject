const express = require('express');
let MongoClient = require("mongodb").MongoClient;
let url = 
require("dotenv").config;
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function Register() {
    const client = new MongoClient(process.env);

    await client.connect();
    const database = client.db("PoosdDatabase");
    await database.command({ping: 1});
    
    try {

    }

    catch {

    }

    finally {
        
    }
    //await
}
