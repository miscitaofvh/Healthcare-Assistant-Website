const express = require('express');
const verify = require('../controllers/verifyController');
const router = express.Router();

router.post('/verify', verify);

module.exports = router;