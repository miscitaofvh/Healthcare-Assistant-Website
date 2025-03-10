const express = require('express');
const { getPosts, createPost } = require('../controllers/forumController');

const router = express.Router();

router.get('/posts', getPosts);
router.post('/posts', createPost);

module.exports = router;