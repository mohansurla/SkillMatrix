const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getUsers, getUserById, updateUser, getMentors, assignMentorToStudent, getMentorStudents, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authenticate, authorize('admin'), getUsers);
router.get('/mentors', authenticate, authorize('admin', 'mentor'), getMentors);
router.get('/mentor-students', authenticate, authorize('admin', 'mentor'), getMentorStudents);
router.post('/mentor-students', authenticate, authorize('admin'), [
  body('mentor_id').isInt().withMessage('Valid mentor_id required'),
  body('student_id').isInt().withMessage('Valid student_id required'),
], validate, assignMentorToStudent);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
], validate, updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
