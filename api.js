const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
//const { ObjectId } = require('mongodb');

require('dotenv').config();


// Login tokens last this long. Every authenticated API call hands back a
// refreshed token, so active users stay logged in.
const LOGIN_TOKEN_LIFETIME = '24h';

// Password reset tokens are only good for finishing one reset.
const RESET_TOKEN_LIFETIME = '15m';


function tokenSecret() {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is missing from .env');
    }
    return process.env.ACCESS_TOKEN_SECRET;
}


const token = {

    // Returns { accessToken } on success or { error } on failure
    createToken(userId, username) {

        try {
            const user = { userId: String(userId), username: username };
            return { accessToken: jwt.sign(user, tokenSecret(), { expiresIn: LOGIN_TOKEN_LIFETIME }) };
        }
        catch (e) {
            return { error: e.message };
        }
    },

    // True when the token is missing, tampered with, or past its expiry
    isExpired(jwtToken) {

        try {
            jwt.verify(jwtToken, tokenSecret());
            return false;
        }
        catch (e) {
            return true;
        }
    },

    // Issues a fresh login token for the same user
    refresh(jwtToken) {

        const payload = jwt.decode(jwtToken);
        return token.createToken(payload.userId, payload.username);
    },

    // Reads the userId out of a token that has already passed isExpired()
    getUserId(jwtToken) {

        return jwt.decode(jwtToken).userId;
    },

    // The reset token is signed with the user's current password hash added to the secret, so it stops working as soon as the password changes (one use only).
    createResetToken(email, passwordHash) {

        return jwt.sign({ email: email, purpose: 'reset' }, tokenSecret() + passwordHash, { expiresIn: RESET_TOKEN_LIFETIME });
    },

    // Returns the email inside an unverified reset token, or null if it is malformed
    peekResetEmail(resetToken) {

        const payload = jwt.decode(resetToken);

        if (!payload || payload.purpose !== 'reset' || typeof payload.email !== 'string') {

            return null;
        }
        return payload.email;
    },

    verifyResetToken(resetToken, passwordHash) {

        try {
            return jwt.verify(resetToken, tokenSecret() + passwordHash).purpose === 'reset';
        }
        catch (e) {
            return false;
        }
    },
};


// Email (NodeMailer through SendGrid, or any SMTP server set in .env)
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;


const transporter = SMTP_HOST
    ? nodemailer.createTransport({

        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },

    }) : null;


// Temporary, for testing before email is set up: DEV_SHOW_CODES=true in .env sends each code back to the browser so it can be shown on the page. It only works while SMTP_HOST is empty, so it turns itself off once real email is configured. Never turn it on for the live site.
const showCodesInBrowser = !transporter && process.env.DEV_SHOW_CODES === 'true';
if (!transporter) {
    console.warn(showCodesInBrowser
        ? 'SMTP_HOST is not set: verification codes are printed here AND shown in the browser (DEV_SHOW_CODES=true).'
        : 'SMTP_HOST is not set: verification codes will be printed to this console instead of emailed.');
}


const EMAIL_SUBJECTS = {
    register: 'Your Poosdalatro verification code',
    reset: 'Your Poosdalatro password reset code',
};


const EMAIL_INTROS = {
    register: 'Use this code to finish creating your Poosdalatro account:',
    reset: 'Use this code to reset your Poosdalatro password:',
};


// Sends a one-time code. purpose is 'register' or 'reset'.
async function sendCodeEmail(to, code, purpose, minutesValid) {
    const intro = EMAIL_INTROS[purpose];
    const footer = `This code expires in ${minutesValid} minutes. If you didn't ask for it, you can ignore this email.`;

    if (!transporter) {
        console.log(`[dev email] ${purpose} code for ${to}: ${code}`);
        return;
    }

    await transporter.sendMail({
        from: MAIL_FROM || SMTP_USER,
        to: to,
        subject: EMAIL_SUBJECTS[purpose],
        text: `${intro}\n\n${code}\n\n${footer}`,
        html: `<p>${intro}</p>`
            + `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>`
            + `<p style="color:#666">${footer}</p>`,
    });
}


// API endpoints
const DB_NAME = 'PoosdDatabase';

const CODE_MINUTES_VALID = 10;      // how long an emailed code works
const RESEND_COOLDOWN_SECONDS = 60; // how often a new code can be requested
const MAX_CODE_ATTEMPTS = 5;        // wrong guesses before a code is thrown away

// Usernames compare case-insensitively ("Alec" and "alec" are the same name)
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;


// Every response carries an "error" field: '' on success, a readable message otherwise.
function fail(res, status, message) {
    res.status(status).json({ error: message });
}


// Express 5 forwards thrown errors to its HTML error page. This wrapper turns them into the same JSON shape every other response uses.
function route(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        }
        catch (e) {
            console.error(`${req.method} ${req.path} failed:`, e);
            fail(res, 500, 'Something went wrong on the server. Please try again.');
        }
    };
}


function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}


function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}


function passwordProblem(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return '';
}


function hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
}


const LEADERBOARD_SIZE = 100;
const MAX_SEARCH_LENGTH = 50;


// Makes user-typed text safe to put inside a regex (partial-match search)
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function searchText(value) {
    return cleanString(value).slice(0, MAX_SEARCH_LENGTH);
}


// The player's local calendar day, "YYYY-MM-DD". tzOffset is the browser's Date.getTimezoneOffset() (minutes behind UTC); anything odd falls back to UTC.
function localDay(date, tzOffset) {
    const offset = Number.isInteger(tzOffset) && Math.abs(tzOffset) <= 14 * 60 ? tzOffset : 0;
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}


// Checks the jwtToken in the request body. Returns the user's ObjectId and a refreshed token, or sends a 401 and returns null.
function requireLogin(req, res) {
    const jwtToken = req.body.jwtToken;
    if (!token.isExpired(jwtToken)) {
        const userId = token.getUserId(jwtToken);
        const refreshed = token.refresh(jwtToken);
        if (mongoose.Types.ObjectId.isValid(userId) && refreshed.accessToken) {
            return { userId: new mongoose.Types.ObjectId(userId), jwtToken: refreshed.accessToken };
        }
    }
    fail(res, 401, 'Your login has expired. Please log in again.');
    return null;
}


// Express API
exports.setApp = function (app, mongoose) {

    const db = mongoose.connection.db;  //client.db(DB_NAME);
    const users = db.collection('Users');
    const codes = db.collection('VerificationCodes');
    const leaderboard = db.collection('Leaderboard');

    // One account per email and per username. The partial filters skip older test documents in Users that don't have these fields.
    Promise.all([
        users.createIndex({ email: 1 }, {
            unique: true, partialFilterExpression: { email: { $type: 'string' } },
        }),
        users.createIndex({ username: 1 }, {
            unique: true, collation: CASE_INSENSITIVE,
            partialFilterExpression: { username: { $type: 'string' } },
        }),
        codes.createIndex({ email: 1, purpose: 1 }, { unique: true }),
        // MongoDB deletes codes on its own once they expire
        codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        // Keeps the leaderboard ordered: highest score first, earliest wins ties
        leaderboard.createIndex({ score: -1, date: 1 }),
        leaderboard.createIndex({ day: 1 }),
        // A run can only be saved once, even if the request is retried
        leaderboard.createIndex({ runId: 1 }, { unique: true }),
    ]).catch(e => console.error('Could not create database indexes:', e.message));


    function findUserByUsername(username) {
        return users.findOne({ username: username }, { collation: CASE_INSENSITIVE });
    }

    
    // Use the run's end time if it's from the last 7 days, otherwise now
    function scoreDate(endedAt) {
        const now = Date.now();
        const ended = typeof endedAt === 'string' ? Date.parse(endedAt) : NaN;
        const believable = Number.isFinite(ended) && ended <= now + 5 * 60 * 1000 && ended >= now - 7 * 24 * 60 * 60 * 1000;
        return new Date(believable ? Math.min(ended, now) : now);
    }

    // New score helper function
    async function recordScore({ userId, username, runId, score, table, tzOffset, mode, endedAt }) {

        const date = scoreDate(endedAt);
        const entry = { runId: runId, score: score, table: table, date: date, day: localDay(date, tzOffset) };
        if (mode) entry.mode = mode;

        // The filter skips the update if this run is already in the list
        const updated = await users.findOneAndUpdate(
            { _id: userId, 'scores.runId': { $ne: runId } },
            { $push: { scores: entry }, $max: { bestScore: score } },
            { returnDocument: 'after', projection: { bestScore: 1 } }
        );
        await leaderboard.updateOne(
            { runId: runId },
            { $setOnInsert: { userId: userId, username: username, ...entry } },
            { upsert: true }
        );

        const bestScore = updated
            ? updated.bestScore
            : (await users.findOne({ _id: userId }, { projection: { bestScore: 1 } }))?.bestScore;
        const rank = await leaderboard.countDocuments({ score: { $gt: score } }) + 1;
        return { bestScore: Math.max(bestScore || 0, score), rank: rank };
    }


    // Checks a code the user typed in. Returns '' when it matches, otherwise the message to show. A matching code is used up so it can't be replayed.
    async function useCode(email, purpose, code) {
        const entry = await codes.findOne({ email: email, purpose: purpose });

        if (!entry || entry.expiresAt < new Date()) {
            return 'That code has expired. Please request a new one.';
        }

        const typed = Buffer.from(hashCode(cleanString(code)));
        const expected = Buffer.from(entry.codeHash);
        if (!crypto.timingSafeEqual(typed, expected)) {
            const attempts = entry.attempts + 1;
            if (attempts >= MAX_CODE_ATTEMPTS) {
                await codes.deleteOne({ _id: entry._id });
                return 'Too many incorrect attempts. Please request a new code.';
            }
            await codes.updateOne({ _id: entry._id }, { $set: { attempts: attempts } });
            return 'That code is incorrect.';
        }

        await codes.deleteOne({ _id: entry._id });
        return '';
    }


    // Emails a 6-digit code. Used by both registration and password reset.
    app.post('/api/sendcode', route(async (req, res) => {

        // incoming: email, purpose ('register' | 'reset'), username (register only) 
        // outgoing: error, expiresInMinutes

        const email = normalizeEmail(req.body.email);
        const purpose = req.body.purpose;

        if (purpose !== 'register' && purpose !== 'reset') {

            return fail(res, 400, "purpose must be 'register' or 'reset'");
        }
        if (!EMAIL_PATTERN.test(email)) {

            return fail(res, 400, 'Please enter a valid email address');
        }

        if (purpose === 'register') {

            // Catch taken names now, before the user goes to check their email
            const username = cleanString(req.body.username);
            if (!USERNAME_PATTERN.test(username)) {
                return fail(res, 400, 'Username must be 3-20 letters, numbers or underscores');
            }
            if (await users.findOne({ email: email })) {
                return fail(res, 409, 'An account with that email already exists');
            }
            if (await findUserByUsername(username)) {
                return fail(res, 409, 'That username is already taken');
            }
        }
        else if (!(await users.findOne({ email: email }))) {

            // Don't reveal which emails have accounts: answer as if a code was sent
            return res.status(200).json({ error: '', expiresInMinutes: CODE_MINUTES_VALID });
        }

        const existing = await codes.findOne({ email: email, purpose: purpose });

        if (existing) {

            const secondsSinceLast = (Date.now() - existing.createdAt.getTime()) / 1000;

            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {

                const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
                return fail(res, 429, `Please wait ${wait} seconds before requesting another code`);
            }
        }

        const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
        const now = new Date();

        // A new code replaces any older one for the same email and purpose
        await codes.updateOne(
            { email: email, purpose: purpose },
            {
                $set: {
                    codeHash: hashCode(code),
                    attempts: 0,
                    createdAt: now,
                    expiresAt: new Date(now.getTime() + CODE_MINUTES_VALID * 60 * 1000),
                },
            },
            { upsert: true }
        );

        try {

            await sendCodeEmail(email, code, purpose, CODE_MINUTES_VALID);
        }
        catch (e) {

            console.error('Sending email failed:', e.message);
            await codes.deleteOne({ email: email, purpose: purpose });
            return fail(res, 502, "We couldn't send the email. Please try again.");
        }

        const ret = { error: '', expiresInMinutes: CODE_MINUTES_VALID };

        if (showCodesInBrowser) {

            ret.devCode = code; // testing only, see DEV_SHOW_CODES near the top of this file
        }
        res.status(200).json(ret);

    }));


    // Creates the account once the emailed code checks out, then logs the user in. Accounts only exist after the email is verified.
    app.post('/api/register', route(async (req, res) => {

        // incoming: username, email, password, code
        // outgoing: accessToken, error

        const username = cleanString(req.body.username);
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;

        if (!USERNAME_PATTERN.test(username)) {

            return fail(res, 400, 'Username must be 3-20 letters, numbers or underscores');
        }

        if (!EMAIL_PATTERN.test(email)) {

            return fail(res, 400, 'Please enter a valid email address');
        }

        const problem = passwordProblem(password);

        if (problem) {

            return fail(res, 400, problem);
        }

        const codeError = await useCode(email, 'register', req.body.code);

        if (codeError) {

            return fail(res, 400, codeError);
        }

        const newUser = {

            username: username,
            email: email,
            password: await bcrypt.hash(password, 10),
            isVerified: true,
            createdAt: new Date(),
            bestScore: 0,
            scores: [],
        };

        let userId;
        try {

            userId = (await users.insertOne(newUser)).insertedId;
        }
        catch (e) {

            // Someone else took the name or email while this user was checking their inbox
            if (e.code === 11000) {

                return fail(res, 409, e.keyPattern && e.keyPattern.email
                    ? 'An account with that email already exists'
                    : 'That username is already taken');
            }
            throw e;
        }

        const ret = token.createToken(userId, username);

        if (ret.error) {

            return fail(res, 500, ret.error);
        }
        res.status(201).json({ accessToken: ret.accessToken, error: '' });
    }));


    // POST /api/login
    app.post('/api/login', route(async (req, res) => {

        // incoming: login (username or email), password
        // outgoing: accessToken, error

        const login = cleanString(req.body.login);
        const password = req.body.password;

        if (!login || typeof password !== 'string' || !password) {

            return fail(res, 400, 'Please enter your username or email and your password');
        }

        const user = login.includes('@')
            ? await users.findOne({ email: normalizeEmail(login) })
            : await findUserByUsername(login);

        const matches = user && typeof user.password === 'string' && await bcrypt.compare(password, user.password);

        if (!matches) {

            return fail(res, 401, 'Incorrect username/email or password');
        }

        const ret = token.createToken(user._id, user.username);

        if (ret.error) {

            return fail(res, 500, ret.error);
        }
        res.status(200).json({ accessToken: ret.accessToken, error: '' });

    }));


    // POST /api/verifyresetcode: First forgot-password page: trades the emailed code for a short-lived reset token.
    app.post('/api/verifyresetcode', route(async (req, res) => {

        // incoming: email, code
        // outgoing: resetToken, error

        const email = normalizeEmail(req.body.email);

        const codeError = await useCode(email, 'reset', req.body.code);

        if (codeError) {

            return fail(res, 400, codeError);
        }

        const user = await users.findOne({ email: email });

        if (!user) {

            return fail(res, 400, 'That code has expired. Please request a new one.');
        }

        res.status(200).json({ resetToken: token.createResetToken(email, user.password), error: '' });

    }));


    // POST /api/resetpassword: Second forgot-password page: sets the new password.
    app.post('/api/resetpassword', route(async (req, res) => {

        // incoming: resetToken, newPassword
        // outgoing: error

        const { resetToken, newPassword } = req.body;
        const expiredMessage = 'This reset link has expired. Please start over.';

        const email = token.peekResetEmail(resetToken);
        const user = email && await users.findOne({ email: email });

        if (!user || !token.verifyResetToken(resetToken, user.password)) {

            return fail(res, 400, expiredMessage);
        }

        const problem = passwordProblem(newPassword);

        if (problem) {

            return fail(res, 400, problem);
        }

        await users.updateOne(

            { _id: user._id },
            { $set: { password: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() } }
        );

        res.status(200).json({ error: '' });
    }));

    // POST /api/checktoken: Confirms a saved login is still good and hands back a refreshed token.
    app.post('/api/checktoken', route(async (req, res) => {

        // incoming: jwtToken
        // outgoing: accessToken, error

        const { jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {

            return fail(res, 401, 'Your login has expired. Please log in again.');
        }

        const refreshed = token.refresh(jwtToken);

        if (refreshed.error) {

            return fail(res, 500, refreshed.error);
        }
        res.status(200).json({ accessToken: refreshed.accessToken, error: '' });

    }));


    // POST /api/savescore: Called when a run ends. Adds the score to the user's own list and to the Leaderboard collection. Saving the same runId twice does nothing.
    // incoming: jwtToken, runId, score, table, tzOffset, endedAt (optional)
    app.post('/api/savescore', route(async (req, res) => {

        const login = requireLogin(req, res);
        if (!login) return;

        const { score, table, tzOffset, endedAt } = req.body;
        const runId = cleanString(req.body.runId);

        if (!Number.isSafeInteger(score) || score < 0) {

            return fail(res, 400, 'score must be a whole number of chips');
        }
        if (!Number.isSafeInteger(table) || table < 1) {

            return fail(res, 400, 'table must be a positive whole number');
        }
        if (!/^[A-Za-z0-9-]{8,64}$/.test(runId)) {

            return fail(res, 400, 'runId is missing or invalid');
        }

        const user = await users.findOne({ _id: login.userId }, { projection: { username: 1, bestScore: 1 } });

        if (!user) {

            return fail(res, 401, 'Your login has expired. Please log in again.');
        }

        const { bestScore, rank } = await recordScore({

            userId: login.userId, username: user.username, runId, score, table, tzOffset, endedAt,
        });

        res.status(200).json({

            bestScore: bestScore,
            rank: rank,
            jwtToken: login.jwtToken,
            error: '',
        });

    }));


    // POST /api/myscores: The Profile page: the user's best score and every score they've had.
    // Search partially matches the date ("2026-11" = every game in November). sort: 'date' (newest first, the default) or 'score' (highest first).
    app.post('/api/myscores', route(async (req, res) => {

        // incoming: jwtToken, search, sort
        // outgoing: username, bestScore, gamesPlayed, scores[{score, table, date, day}], jwtToken, error

        const login = requireLogin(req, res);
        if (!login) return;

        const user = await users.findOne(

            { _id: login.userId },
            { projection: { username: 1, bestScore: 1, gamesPlayed: { $size: { $ifNull: ['$scores', []] } } } }
        );

        if (!user) {

            return fail(res, 401, 'Your login has expired. Please log in again.');
        }

        const search = searchText(req.body.search);
        const pipeline = [

            { $match: { _id: login.userId } },
            { $unwind: '$scores' },
            { $replaceWith: '$scores' },
        ];

        if (search) {

            pipeline.push({ $match: { day: { $regex: escapeRegex(search), $options: 'i' } } });
        }

        pipeline.push(

            { $sort: req.body.sort === 'score' ? { score: -1, date: -1 } : { date: -1 } },
            { $project: { _id: 0, score: 1, table: 1, date: 1, day: 1 } }
        );

        const scores = await users.aggregate(pipeline).toArray();

        res.status(200).json({
            username: user.username,
            bestScore: user.bestScore || 0,
            gamesPlayed: user.gamesPlayed,
            scores: scores,
            jwtToken: login.jwtToken,
            error: '',
        });

    }));


    // POST /api/leaderboard: Top 100 scores, highest first. search partially matches a username or a date, giving the top scores for that player or that day.
    app.post('/api/leaderboard', route(async (req, res) => {

        // incoming: jwtToken, search
        // outgoing: results[{username, score, table, date, day}], jwtToken, error

        const login = requireLogin(req, res);
        if (!login) return;

        const search = searchText(req.body.search);
        const filter = {};

        if (search) {

            const pattern = { $regex: escapeRegex(search), $options: 'i' };
            filter.$or = [{ username: pattern }, { day: pattern }];
        }

        const results = await leaderboard

            .find(filter, { projection: { _id: 0, username: 1, score: 1, table: 1, date: 1, day: 1 } })
            .sort({ score: -1, date: 1 })
            .limit(LEADERBOARD_SIZE)
            .toArray();

        res.status(200).json({ results: results, jwtToken: login.jwtToken, error: '' });

    }));


    // Example endpoints from the class starter code, kept until the game's own search endpoint replaces them.
    app.post('/api/addcard', route(async (req, res) => {

        // incoming: userId, card, jwtToken
        // outgoing: error, jwtToken

        const { userId, card, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
        }

        let error = '';
        try {
            await db.collection('Cards').insertOne({ Card: card, UserId: userId });
        }
        catch (e) {
            error = e.toString();
        }

        res.status(200).json({ error: error, jwtToken: token.refresh(jwtToken) });
    }));


    app.post('/api/searchcards', route(async (req, res) => {

        // incoming: userId, search, jwtToken
        // outgoing: results[], error, jwtToken

        const { search, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
        }

        const _search = (search ?? '').trim();
        const results = await db.collection('Cards')
            .find({ Card: { $regex: _search + '.*', $options: 'i' } }).toArray();

        res.status(200).json({
            results: results.map(r => r.Card),
            error: '',
            jwtToken: token.refresh(jwtToken),
        });
    }));

    // Multiplayer API
    require('./multiplayer/api.js').setApp(app, { route, fail, requireLogin, users, recordScore });
}