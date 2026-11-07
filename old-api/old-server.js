//const { MongoClient } = require('mongodb')

//const client = new MongoClient(url);

// const Username = "###########";
// const Password = "###########";
// const name = "###########";
// const greeting = `Hello, ${name}!`;

/* This function inserts random info. Going to modify this.
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
}*/

/* CAUSING PROBLEMS
// Call this only when your application terminates
export async function disconnectFromMongoDB() {
    await client.close();
    console.log("Connection closed.");
}*/

// OLD CODE:
// mongodb+srv://<db_username>:<db_password>@poosdbase.puafigd.mongodb.net/
// Add this to the bottom of server.js to actually run the code
// connectToMongoDB();


// In the mean time, this function has better syntax anyways.
//client.connect()
//    .then(() => console.log('MongoDB connected'))
//    .catch(err => console.error('MongoDB connection failed:', err.message));