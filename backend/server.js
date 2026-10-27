import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { connectToMongoDB, disconnectFromMongoDB, usersCollection } from './db.js';
import { createToken, requireAuth } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/register', async (req, res) => {
  const { username, password, confirmPassword, email } = req.body ?? {};

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password and email are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email' });
  }

  try {
    const users = usersCollection();
    const existing = await users.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const field = existing.username === username ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} is already taken` });
    }

    const newUser = {
      email,
      username,
      password: await bcrypt.hash(password, 10),
      scores: []
    };
    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    res.status(201).json({ token: createToken(newUser), username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, please try again' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await usersCollection().findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Username/Password combination incorrect' });
    }

    res.json({ token: createToken(user), username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, please try again' });
  }
});

// Returns the logged-in user's info; the frontend uses it to check the token is still valid
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

const PORT = process.env.PORT || 5000;

connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});
