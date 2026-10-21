const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Checks the JWT and attaches the user to req.user
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User no longer exists.' });

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ message: msg });
  }
};

// 2. Restricts a route to the given roles. Use AFTER verifyToken.
//    e.g. router.get('/', verifyToken, authorizeRoles('hr', 'manager'), handler)
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Role '${req.user ? req.user.role : 'unknown'}' is not allowed to access this resource.`,
    });
  }
  next();
};

module.exports = { verifyToken, authorizeRoles };
