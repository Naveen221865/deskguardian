const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function librarianOnly(req, res, next) {
  if (req.user.role !== 'librarian') return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { auth, librarianOnly };
