//save packages into variables for easy calling of their functions and objects
const express = require('express');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jsonWebToken = require("jsonwebtoken");
const cors = require('cors');
const User = require('../models/user.js');
const Server = require('../server.js');
const nodemaile = require(nodemailer);

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config(); //take in key-value pairs from env file, put them in the predefined process.env object for easy access.

const PORT = process.env.PORT || 5000;


//console.log(process.env.MONGO_URI);

connectToDatabase();

async function connectToDatabase() { // == const connectToDatabase = async () => {}
    try {
        await mongoose.connect(process.env.MONGO_URI); 
        
        console.log("\nConnection successful.\n");
        process.exit(0);
    }

    catch (error) {
        console.log("\n\Database connection failed\n");
        process.exit(1);
    }
    
    //mongoose.close();

}

app.post('/login', Login);

async function Login(req, res) {
    try {
        email = req.body.email
        password = req.body.password;

        if (!username || !password) {
            res.status(400).json({
                error: "Missing parameter",
                message: "Invalid username or password."
            });
        }
        
        const foundUser = await User.findOne(email);
        if (!foundUser) {
            return res.status(401).json({
                message:"Invalid email"
            });
        }

        if (!foundUser.isVerified) {
            return res.status(403).json({
                message: "Your account is unverified. Check your email",
            });
        }

        const isMatch = await foundUser.comparePassword(password);
        if (!isMatch) {
            
        }
    }

    catch {

    }
    

    const database = mongoose.db("PoosdDatabase");
    await database.command({ping: 1});
}

async function Register() {

}
/*
async function Login() {

    console.log(client);

    await client.connect();
    const session = client.startSession();

    const database = client.db("PoosdDatabase");
    await database.command({ping: 1});
    
    //const userName = database.collection("Username");
    console.log(username);
    
    try {
    app.post("/login", async (req, res) => {
        const username = req.body;
        const password = req.body;

        console.log(PORT);
        //document.write(req.body)
    
        if (!username || !password) {
            res.status(400).json({
                error: "Missing parameter",
                message: "Invalid username or password."
            });
        }

        else {
            res.status(200).json({
                firstName: req.firstName,
                lastName: req.lastName,
                id: req.id,
            })
        }
    });
    }
    

    

    catch {
        console.log(username);
    }

    client.close();
}
    */
