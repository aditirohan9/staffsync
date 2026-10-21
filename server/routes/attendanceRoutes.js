const router = require('express').Router();
const { markAttendance, getMyAttendance, getAllAttendance } = require('../controllers/attendanceController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/mark', markAttendance);
router.get('/my', getMyAttendance);
router.get('/all', authorizeRoles('hr', 'manager'), getAllAttendance);

module.exports = router;
