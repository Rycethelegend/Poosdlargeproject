const express = require('express');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require('cors');
const auth = require("./routes/auth.js");


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
}

app.use('./routes/auth.js', homeRouteHandler());

//the part that actually process http requests and return a json
function homeRouteHandler(req, res) {
    //res.send()
    //console.log("\ndone\n");
}
app.get('/', homeRouteHandler);

app.listen(PORT, function() {
    console.log("PORT: " + PORT);
})