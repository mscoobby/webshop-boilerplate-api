const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home')
const contactController = require('../controllers/contact')

router.get('/', homeController.index)
router.get('/contact', contactController.getContact);
router.post('/contact', contactController.postContact);

module.exports = router;
