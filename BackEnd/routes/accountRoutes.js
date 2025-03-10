const express = require('express');
const { getUsers, registerUser, loginUser } = require('../controllers/accountController');

const router = express.Router();

router.get('/', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;