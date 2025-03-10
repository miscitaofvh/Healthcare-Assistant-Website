const express = require('express');
const { getNews, createNews } = require('../controllers/newsController');

const router = express.Router();

router.get('/', getNews);
router.post('/', createNews);

module.exports = router;