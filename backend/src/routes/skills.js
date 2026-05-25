const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getSkills, createSkill, updateSkill, deleteSkill } = require('../controllers/skillController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', authenticate, getSkills);
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Skill name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
], validate, createSkill);
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
], validate, updateSkill);
router.delete('/:id', authenticate, authorize('admin'), deleteSkill);

module.exports = router;
