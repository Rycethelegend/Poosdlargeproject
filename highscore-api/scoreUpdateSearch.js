const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


async function startServer() {
  // Process env file, no MONGO URI
  if (!process.env.MONGO_URI) {
    throw new Error("Add MONGO_URI to your .env file.");
  }

  const client = new MongoClient(process.env.MONGO_URI);

  await client.connect();
  const database = client.db("PoosdDatabase");
  await database.command({ ping: 1 });

  //Declare Database Variables (Leaderboard & User Scores)
  const leaderboard = database.collection("Leaderboard");
  const users = database.collection("Users");

  app.get("/", (req, res) => {
    res.json({ message: "Highscore API is running!" });
  });

  // Update Score API
  app.put("/api/highscore/:username", async (req, res) => {
    const score = req.body?.score;
    const username = req.params.username;

    if (!Number.isSafeInteger(score)) {
      return res.status(400).json({
        message: "Score must be a whole number."
      });
    }

    // User Session/Data Check 
    const session = client.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const user = await users.findOne(
          {username}, {session, projection: {_id: 1, scores: 1}}
        );

        // No Username
        if (!user) {
          return null;
        }

        // Includes previous history when creating a leaderboard entry
        const highscore = (user.scores || []).reduce (
          (highest, entry) =>
            Number.isSafeInteger(entry.score) ? Math.max(highest, entry.score) : highest, score
        );

        // Save every submitted score
        await users.updateOne (
          { _id: user._id },
          { 
            $push: {
              scores: {
              score,
                Date: new Date().toISOString()
              }
            }
          },
          { session }
        );

        // Create a leaderboard or update highscore
        const update = await leaderboard.updateOne(
          { username },
          {
            $max: { score: highscore},
            $setOnInsert: {userid: String(user._id)}
          },
          { session, upsert: true }
        );

        const player = await leaderboard.findOne(
          { username },
          {
            session,
            projection: { _id: 0, userid: 1, username: 1, score: 1 }
          }
        );

        return {
          message: "Score added to history.",
          submittedScore: score,
          leaderboardUpdated:
            update.modifiedCount > 0 || update.upsertedCount > 0,
          player
        };
    });

    // Error catcher for if User doesn't exist
    if (!result) {
      return res.status(404).json({
        message: "Player not found in Users"
      });
    }

      res.json(result);
    } catch (error) {
      console.error("Score submission failed:", error.message);
      res.status(500).json({
        message: "Unable to save score."
      });
    } finally {
      await session.endSession();
    }
  });

  // Search Leaderboard Entry
  app.get("/api/highscore/:username", async (req, res) => {
    try {

      // Check Database for username & leave out whitespaces
      const search = req.params.username.trim();
      // Length of user must be less than 50 characters
      if (!search || search.length > 50) {
        return res.status(400).json({
          message: "Search must contain 1–50 characters."
        });
      }

      // Accounts for weird characters
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const player = await leaderboard.find(
        {
        username: {
          $regex: escapedSearch,
          $options: "i"
        }
      },
      {
        projection: {
          _id: 0,
          userid: 1,
          username: 1,
          score: 1
        }
      })
      .sort({ score: -1, username: 1 })
      .limit(50)
      .toArray();

      // No player
      if (!player) {
        return res.status(404).json({
          message: "Player not found in Leaderboard."
        });
      }

      res.json(player);
    } catch (error) {
      console.error("Leaderboard search failed:", error.message);
      res.status(500).json({
        message: "Unable to search leaderboard."
      });
    }
  });

  app.listen(PORT, () => {
    console.log("Connected to MongoDB");
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});