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
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

// Usernames are compared ignoring capitals, like the main server
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

app.post('/api/register', async (req, res) => {
  const { password, confirmPassword } = req.body ?? {};
  const username = String(req.body?.username ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password and email are required' });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email' });
  }

  try {
    const users = usersCollection();
    if (await users.findOne({ username }, { collation: CASE_INSENSITIVE })) {
      return res.status(409).json({ error: 'Username is already taken' });
    }
    if (await users.findOne({ email })) {
      return res.status(409).json({ error: 'Email is already taken' });
    }

    // Same fields the main server saves (this prototype skips the email code)
    const newUser = {
      username,
      email,
      password: await bcrypt.hash(password, 10),
      isVerified: false,
      createdAt: new Date(),
      bestScore: 0,
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
  const { password } = req.body ?? {};
  const login = String(req.body?.username ?? '').trim();

  if (!login || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Username or email, like the main server
    const users = usersCollection();
    const user = login.includes('@')
      ? await users.findOne({ email: login.toLowerCase() })
      : await users.findOne({ username: login }, { collation: CASE_INSENSITIVE });

    if (!user || typeof user.password !== 'string' || !(await bcrypt.compare(password, user.password))) {
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
