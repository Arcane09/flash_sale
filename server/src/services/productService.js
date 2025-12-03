const { Op, fn, col } = require('sequelize');
const { Product, Order } = require('../models');

async function getLiveProducts() {
  const now = new Date();

  const products = await Product.findAll({
    where: {
      sale_starts_at: { [Op.lte]: now },
      sale_ends_at: { [Op.gte]: now },
    },
    order: [['id', 'ASC']],
  });

  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  // Aggregate holds and confirmed orders per product
  const aggregates = await Order.findAll({
    attributes: [
      'product_id',
      [fn('SUM', col('quantity')), 'total_qty'],
      'status',
    ],
    where: {
      product_id: { [Op.in]: productIds },
      status: { [Op.in]: ['pending', 'confirmed'] },
    },
    group: ['product_id', 'status'],
    raw: true,
  });

  const aggMap = {};
  aggregates.forEach((row) => {
    const pid = row.product_id;
    if (!aggMap[pid]) {
      aggMap[pid] = { holds: 0, confirmed: 0 };
    }
    if (row.status === 'pending') {
      aggMap[pid].holds += Number(row.total_qty || 0);
    } else if (row.status === 'confirmed') {
      aggMap[pid].confirmed += Number(row.total_qty || 0);
    }
  });

  const nowTs = now.getTime();

  return products.map((p) => {
    const stats = aggMap[p.id] || { holds: 0, confirmed: 0 };
    const currentStock = p.total_stock;
    const initialStock = currentStock + stats.holds + stats.confirmed;
    const soldQty = initialStock - currentStock;
    const percentSold =
      initialStock > 0 ? Math.round((soldQty / initialStock) * 100) : 0;

    const saleEndsAtTs = new Date(p.sale_ends_at).getTime();
    const countdownSeconds = Math.max(
      0,
      Math.floor((saleEndsAtTs - nowTs) / 1000)
    );

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      total_stock: p.total_stock,
      live_stock: currentStock,
      holds: stats.holds,
      confirmed: stats.confirmed,
      percent_sold: percentSold,
      sale_starts_at: p.sale_starts_at,
      sale_ends_at: p.sale_ends_at,
      countdown_seconds: countdownSeconds,
    };
  });
}

module.exports = {
  getLiveProducts,
};


