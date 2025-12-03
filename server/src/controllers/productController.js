const productService = require('../services/productService');

async function getLiveProducts(req, res, next) {
  try {
    const products = await productService.getLiveProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLiveProducts,
};


