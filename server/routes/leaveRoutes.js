const router = require('express').Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', applyLeave);
router.get('/', getLeaves);
router.put('/:id/status', authorizeRoles('manager', 'hr'), updateLeaveStatus);

module.exports = router;
