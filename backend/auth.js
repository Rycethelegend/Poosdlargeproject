import jwt from 'jsonwebtoken';

const TOKEN_LIFETIME = '2h';

export function createToken(user) {
  return jwt.sign(
    { userId: String(user._id), username: user.username },
    process.env.JWT_SECRET,
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
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}
