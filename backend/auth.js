import jwt from 'jsonwebtoken';

// Same secret and lifetime as the main server, so tokens work on both
const TOKEN_LIFETIME = '24h';

function secret() {
  return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
}

export function createToken(user) {
  return jwt.sign(
    { userId: String(user._id), username: user.username },
    secret(),
    { expiresIn: TOKEN_LIFETIME }
  );
}

// Express middleware: rejects requests without a valid "Authorization: Bearer <token>" header
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}
