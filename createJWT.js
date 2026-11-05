const jwt = require("jsonwebtoken");
require("dotenv").config();

// Login tokens last this long. Every authenticated API call hands back a
// refreshed token, so active users stay logged in.
const LOGIN_TOKEN_LIFETIME = '24h';

// Password reset tokens are only good for finishing one reset.
const RESET_TOKEN_LIFETIME = '15m';

function secret() {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is missing from .env');
    }
    return process.env.ACCESS_TOKEN_SECRET;
}

// Returns { accessToken } on success or { error } on failure
exports.createToken = function (userId, username) {
    try {
        const user = { userId: String(userId), username: username };
        const accessToken = jwt.sign(user, secret(), { expiresIn: LOGIN_TOKEN_LIFETIME });
        return { accessToken: accessToken };
    }
    catch (e) {
        return { error: e.message };
    }
}

// True when the token is missing, tampered with, or past its expiry
exports.isExpired = function (token) {
    try {
        jwt.verify(token, secret());
        return false;
    }
    catch (e) {
        return true;
    }
}

// Issues a fresh login token for the same user
exports.refresh = function (token) {
    const payload = jwt.decode(token);
    return exports.createToken(payload.userId, payload.username);
}

// Reads the userId out of a token that has already passed isExpired()
exports.getUserId = function (token) {
    return jwt.decode(token).userId;
}

// The reset token is signed with the user's current password hash added to the
// secret, so it stops working as soon as the password changes (one use only).
exports.createResetToken = function (email, passwordHash) {
    return jwt.sign({ email: email, purpose: 'reset' }, secret() + passwordHash,
        { expiresIn: RESET_TOKEN_LIFETIME });
}

// Returns the email inside an unverified reset token, or null if it is malformed
exports.peekResetEmail = function (token) {
    const payload = jwt.decode(token);
    if (!payload || payload.purpose !== 'reset' || typeof payload.email !== 'string') {
        return null;
    }
    return payload.email;
}

exports.verifyResetToken = function (token, passwordHash) {
    try {
        const payload = jwt.verify(token, secret() + passwordHash);
        return payload.purpose === 'reset';
    }
    catch (e) {
        return false;
    }
}
