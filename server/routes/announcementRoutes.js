const router = require('express').Router();
const {
  createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement,
} = require('../controllers/announcementController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAnnouncements);
router.post('/', authorizeRoles('hr'), createAnnouncement);
router.put('/:id', authorizeRoles('hr'), updateAnnouncement);
router.delete('/:id', authorizeRoles('hr'), deleteAnnouncement);

module.exports = router;
