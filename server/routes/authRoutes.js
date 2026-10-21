const router = require('express').Router();
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

// Example of RBAC (remove later): only HR can hit this
router.get('/hr-only', verifyToken, authorizeRoles('hr'), (req, res) =>
  res.json({ message: `Welcome HR ${req.user.name}` })
);

module.exports = router;
