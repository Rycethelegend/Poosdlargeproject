import { MongoClient } from 'mongodb';

// Same database and setting names as the main server
const client = new MongoClient(process.env.DATABASE_LINK || process.env.MONGODB_URI);
let database;

// Connect once at startup and reuse the connection for every request
export async function connectToMongoDB() {
  await client.connect();
  database = client.db('PoosdDatabase');
  console.log('Connected to MongoDB');
}

export function usersCollection() {
  return database.collection('Users');
}

// Call this only when the application terminates
export async function disconnectFromMongoDB() {
  await client.close();
  console.log('MongoDB connection closed');
}
