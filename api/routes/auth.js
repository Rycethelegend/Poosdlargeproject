//save packages into variables for easy calling of their functions and objects
const express = require('express');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
//const jsonWebToken = require("jsonwebtoken");
const cors = require('cors');
const User = require('../models/user.js');
//const Server = require('../server.js');
//const nodemailer = require(nodemailer);

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
app.listen(PORT, function() {
    console.log("PORT: " + PORT);
})
console.log();

//Invoke-RestMethod -Uri "http://localhost:5000/api/highscore/FirstUser" -Method Put -ContentType "application/json" -Body '{"score":101}'
//LoginIfVerified();
app.post('/login', LoginIfVerified);
async function LoginIfVerified(req, res) {
    try {
        email = req.body.email
        password = req.body.password;

        if (!username || !password) {
            res.status(400).json({
                error: "Missing parameter",
                message: "Invalid username or password."
            });
        }
        
        const foundUser = await User.findOne({
            email
        });

        if (!foundUser) {
            res.status(401).json({
                message:"Invalid email"
            });
        }

        if (!foundUser.isVerified) {
            res.status(403).json({
                message: "Your account is unverified. Check your email",
            });
        }

        const isMatch = await foundUser.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                message: "Invalid password",
            })
        }
        /*

        if (!foundUser.isVerified) {
            return res.status.json({
                message: "Please register your email"
            })
        }
        */
        return res.status(200).json({
            message: "Login successful.",
            user: {
            id: foundUser._id,
            email: foundUser.email,
      }
});}
        

    catch (err) {
        res.status(500).json( {
            message: err.message,
        })
    }
}



app.post("/login", RegisterAndVerify);

async function RegisterAndVerify(req, res) {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        const presentUser = User.findOne( {
            email,
        });

        if (presentUser) {
            res.status(400).json({
                message: "User already exists",
            })
        }

        const newUser = new User({ 
            username, 
            email,
            password,
            isVerified: false
        });

        await newUser.save();

        return res.status(201).json({
            message: "User registered successfully",
        });
    }

    catch (err) {
        res.status(500).json ( {
            message: err.message,
        });
    }
}
/*

app.get('/login', EmailVerification);
async function EmailVerification(req, res) {
    try {
        const token = req.body.token;

        const email = req.body.email;
        const recipientUser = await User.findOne({
            email
        });


        const mailer = createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
    });
    }
    

    catch(err) {
        res.status(500).json({
            message: err.message,
        })
    }

}


function createTransport(mailSettings) {
    const transport = nodemailer.createTransport({
        host: mailSettings.host,
        port: mailSettings.port || 465,
        secure: mailSettings.secure ?? (mailSettings.port === 465),
        auth: {
            user: mailSettings.user,
            pass: mailSettings.pass,
        }
            
    });
    
    return transport;
 }
*/
/*
console.log(client);

    await client.connect();
    const session = client.startSession();

    const database = client.db("PoosdDatabase");
    await database.command({ping: 1});

*/


