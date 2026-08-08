const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // Restrict all user management routes to Admin

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser);
router.patch('/:id/status', toggleUserStatus);
router.post('/:id/reset-password', resetUserPassword);

module.exports = router;
