const express = require('express');
const { getUser, registerUser, loginUser } = require('../controllers/accountController');

const router = express.Router();

// router.get('/:id', getUser);
// router.put('/:id', updateUser);
// router.delete('/:id', deleteUser);


module.exports = router;