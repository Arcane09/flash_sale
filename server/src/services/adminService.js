const { Op, fn, col, literal } = require('sequelize');
const { getSequelize } = require('../config/sequelize');
const { Product, Order, InventoryEvent } = require('../models');
const { redis } = require('../utils/redisClient');

async function getMetrics() {
  const sequelize = getSequelize();

  const [totalProducts, stockAgg] = await Promise.all([
    Product.count(),
    Product.findAll({
      attributes: [
        [fn('SUM', col('total_stock')), 'total_stock'],
      ],
      raw: true,
    }),
  ]);

  const totalStock = Number(stockAgg[0]?.total_stock || 0);

  const [orderStats, oversellBlockedStr, eventSummary] = await Promise.all([
    Order.findAll({
      attributes: [
        [fn('COUNT', literal('*')), 'count'],
        [fn('SUM', col('quantity')), 'quantity'],
        'status',
      ],
      group: ['status'],
      raw: true,
    }),
    redis.get('metrics:oversell_blocked'),
    InventoryEvent.findAll({
      attributes: [
        'type',
        [fn('COUNT', literal('*')), 'count'],
        [fn('SUM', col('delta')), 'total_delta'],
      ],
      group: ['type'],
      raw: true,
    }),
  ]);

  const statusMap = {};
  orderStats.forEach((row) => {
    statusMap[row.status] = {
      count: Number(row.count || 0),
      quantity: Number(row.quantity || 0),
    };
  });

  const pendingHolds = statusMap.pending || { count: 0, quantity: 0 };
  const confirmedOrders = statusMap.confirmed || { count: 0, quantity: 0 };
  const expiredOrders = statusMap.expired || { count: 0, quantity: 0 };

  const oversellAttemptsBlocked = Number(oversellBlockedStr || 0);

  return {
    total_products: totalProducts,
    total_stock: totalStock,
    current_stock: totalStock,
    pending_holds: pendingHolds,
    confirmed_orders: confirmedOrders,
    expired_orders: expiredOrders,
    oversell_attempts_blocked: oversellAttemptsBlocked,
    inventory_events_summary: eventSummary.map((e) => ({
      type: e.type,
      count: Number(e.count || 0),
      total_delta: Number(e.total_delta || 0),
    })),
  };
}

async function getAdminProductSnapshot() {
  const now = new Date();
  const products = await Product.findAll({
    order: [['id', 'ASC']],
  });

  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  const orderAgg = await Order.findAll({
    attributes: [
      'product_id',
      'status',
      [fn('SUM', col('quantity')), 'qty'],
    ],
    where: {
      product_id: { [Op.in]: productIds },
      status: { [Op.in]: ['pending', 'confirmed', 'expired'] },
    },
    group: ['product_id', 'status'],
    raw: true,
  });

  const map = {};
  orderAgg.forEach((row) => {
    const pid = row.product_id;
    if (!map[pid]) {
      map[pid] = { pending: 0, confirmed: 0, expired: 0 };
    }
    if (row.status === 'pending') map[pid].pending += Number(row.qty || 0);
    if (row.status === 'confirmed') map[pid].confirmed += Number(row.qty || 0);
    if (row.status === 'expired') map[pid].expired += Number(row.qty || 0);
  });

  return products.map((p) => {
    const stats = map[p.id] || { pending: 0, confirmed: 0, expired: 0 };
    return {
      id: p.id,
      name: p.name,
      total_stock: p.total_stock,
      pending_qty: stats.pending,
      confirmed_qty: stats.confirmed,
      expired_qty: stats.expired,
      sale_active:
        p.sale_starts_at <= now && p.sale_ends_at >= now,
    };
  });
}

module.exports = {
  getMetrics,
  getAdminProductSnapshot,
};


