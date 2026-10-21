const router = require('express').Router();
const {
  createTraining, getTrainings, enroll, updateTraining, deleteTraining,
} = require('../controllers/trainingController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getTrainings);
router.post('/', authorizeRoles('manager', 'hr'), createTraining);
router.put('/:id/enroll', authorizeRoles('employee', 'manager'), enroll);
router.put('/:id', authorizeRoles('manager', 'hr'), updateTraining); // creator/HR check in controller
router.delete('/:id', authorizeRoles('manager', 'hr'), deleteTraining);

module.exports = router;
