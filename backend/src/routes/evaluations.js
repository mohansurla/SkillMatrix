const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createEvaluation, getEvaluations } = require('../controllers/evaluationController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authenticate, authorize('mentor', 'admin'), getEvaluations);
router.post('/', authenticate, authorize('mentor'), [
  body('assignment_id').isInt().withMessage('Valid assignment_id required'),
  body('score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('feedback').trim().notEmpty().withMessage('Feedback is required'),
], validate, createEvaluation);

module.exports = router;
