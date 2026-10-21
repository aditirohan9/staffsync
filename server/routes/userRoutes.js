const router = require('express').Router();
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', authorizeRoles('hr', 'manager'), getUsers);
router.put('/:id', updateUser); // HR: anyone, others: self only (enforced in controller)
router.delete('/:id', authorizeRoles('hr'), deleteUser);

module.exports = router;
