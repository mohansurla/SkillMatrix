const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createAssignment, getAssignments, getAssignmentById } = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authenticate, getAssignments);
router.get('/:id', authenticate, getAssignmentById);
router.post('/', authenticate, authorize('student'), [
  body('module_id').isInt().withMessage('Valid module_id required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('file_url').optional().isURL().withMessage('file_url must be a valid URL'),
], validate, createAssignment);

module.exports = router;
