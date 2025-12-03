const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/admin/metrics
router.get('/metrics', authenticate, requireAdmin, adminController.getMetrics);

// Extra: snapshot per product
router.get(
  '/products',
  authenticate,
  requireAdmin,
  adminController.getProductsSnapshot
);

module.exports = router;


