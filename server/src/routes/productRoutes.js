const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// GET /api/products/live
router.get('/live', productController.getLiveProducts);

module.exports = router;


