const {hashCode}= require("../api");
const crypto = require("crypto");
//const server = require("./models/user");

describe("tests creating a hash from string of different lengths", () => {
    test ("creates a hash of a given string for email verification", () => {
        expect(hashCode("3")).toBe(crypto.createHash('sha256').update("3").digest('hex'));
    });
    
    test ("creates no hash for an blank string", () => {
        expect(hashCode(" ")).toBe(crypto.createHash('sha256').update(" ").digest('hex'));
    });
});
