const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/skills', require('./skills'));
router.use('/modules', require('./modules'));
router.use('/assignments', require('./assignments'));
router.use('/evaluations', require('./evaluations'));
router.use('/progress', require('./progress'));
router.use('/notifications', require('./notifications'));

module.exports = router;
