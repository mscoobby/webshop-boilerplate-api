const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop')

router.get('/', shopController.index);
router.get('/:id', shopController.preview);

module.exports = router;
