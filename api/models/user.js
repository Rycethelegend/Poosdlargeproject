const mongoose = require("mongoose");
const cors = require("cors");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },

    firstName: {
        type: String,
        trim: true,
    },

    lastName: {
        type:String,
        trim: true,
    },

    username: {
        type: String, 
        unique: true,
    },

    password: {
        type: String,
        required: true,
        unique: true,
    },

    id: {
        type: Number,
        unique: true,
    },

    isVerified: {
            type: Boolean,
            default: false,
    },
    
    verifcationToken: {
        type: String, 
        required: true,
        unique: true,
        sparse: true,
    },
    

}, {
    timestamps: true, //adds createdAt and updatedAt fields for tracking time away
});

module.exports = mongoose.model("User", UserSchema);



