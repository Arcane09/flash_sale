const adminService = require('../services/adminService');

async function getMetrics(req, res, next) {
  try {
    const metrics = await adminService.getMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

async function getProductsSnapshot(req, res, next) {
  try {
    const products = await adminService.getAdminProductSnapshot();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics,
  getProductsSnapshot,
};


