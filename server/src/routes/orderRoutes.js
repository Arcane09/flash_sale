const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/holds
router.post('/holds', authenticate, orderController.createHold);

// POST /api/orders/:id/confirm
router.post('/orders/:id/confirm', authenticate, orderController.confirmOrder);

// GET /api/orders
router.get('/orders', authenticate, orderController.getOrders);

// GET /api/orders/:id
router.get('/orders/:id', authenticate, orderController.getOrderById);

module.exports = router;


