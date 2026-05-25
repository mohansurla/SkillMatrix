const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getModules, getModuleById, createModule, updateModule, deleteModule } = require('../controllers/moduleController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authenticate, getModules);
router.get('/:id', authenticate, getModuleById);
router.post('/', authenticate, authorize('admin', 'mentor'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('skill_id').isInt().withMessage('Valid skill_id required'),
  body('max_score').optional().isInt({ min: 1, max: 1000 }),
], validate, createModule);
router.put('/:id', authenticate, authorize('admin', 'mentor'), updateModule);
router.delete('/:id', authenticate, authorize('admin'), deleteModule);

module.exports = router;
