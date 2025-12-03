const { Op } = require('sequelize');
const { getSequelize } = require('../config/sequelize');
const { Product, Order, InventoryEvent } = require('../models');
const { acquireLock, releaseLock } = require('../utils/lock');
const { redis } = require('../utils/redisClient');

const HOLD_TTL_SECONDS = 120;

async function createHold({ productId, quantity, customerEmail }) {
  const sequelize = getSequelize();
  const now = new Date();

  const product = await Product.findByPk(productId);
  if (!product) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  if (product.sale_starts_at > now || product.sale_ends_at < now) {
    const err = new Error('Sale not active for this product');
    err.status = 400;
    throw err;
  }

  const lockKey = `lock:product:${productId}`;
  const lock = await acquireLock(lockKey);

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // Atomically decrement stock
    const [affected] = await Product.update(
      { total_stock: sequelize.literal(`total_stock - ${quantity}`) },
      {
        where: {
          id: productId,
          total_stock: { [Op.gte]: quantity },
        },
        transaction,
      }
    );

    if (affected === 0) {
      // oversell attempt blocked
      await redis.incr('metrics:oversell_blocked');
      await transaction.rollback();
      const err = new Error('Insufficient stock');
      err.status = 400;
      throw err;
    }

    const holdExpiresAt = new Date(now.getTime() + HOLD_TTL_SECONDS * 1000);

    const order = await Order.create(
      {
        product_id: productId,
        customer_email: customerEmail,
        quantity,
        status: 'pending',
        hold_expires_at: holdExpiresAt,
      },
      { transaction }
    );

    await InventoryEvent.create(
      {
        product_id: productId,
        type: 'hold_created',
        delta: -quantity,
        metadata: { orderId: order.id, customer_email: customerEmail },
      },
      { transaction }
    );

    await transaction.commit();

    // Set Redis TTL key for hold
    await redis.set(
      `hold:${order.id}`,
      JSON.stringify({
        orderId: order.id,
        productId,
        quantity,
        customerEmail,
      }),
      'EX',
      HOLD_TTL_SECONDS
    );

    await releaseLock(lock);

    return {
      orderId: order.id,
      hold_expires_at: holdExpiresAt,
    };
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        // eslint-disable-next-line no-console
        console.error('Rollback error', rollbackErr);
      }
    }
    try {
      await releaseLock(lock);
    } catch (lockErr) {
      // eslint-disable-next-line no-console
      console.error('Lock release error', lockErr);
    }
    throw err;
  }
}

async function confirmOrder({ orderId, customerEmail }) {
  const sequelize = getSequelize();
  const now = new Date();

  const order = await Order.findOne({
    where: { id: orderId, customer_email: customerEmail },
  });

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  if (order.status === 'confirmed') {
    return { status: 'already_confirmed' };
  }
  if (order.status !== 'pending') {
    const err = new Error('Order is not pending');
    err.status = 400;
    throw err;
  }

  // If hold expired
  if (now > order.hold_expires_at) {
    const transaction = await sequelize.transaction();
    try {
      // Reload with lock
      const freshOrder = await Order.findOne({
        where: { id: orderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (freshOrder.status === 'pending') {
        freshOrder.status = 'expired';
        await freshOrder.save({ transaction });

        await Product.update(
          { total_stock: sequelize.literal(`total_stock + ${freshOrder.quantity}`) },
          { where: { id: freshOrder.product_id }, transaction }
        );

        await InventoryEvent.create(
          {
            product_id: freshOrder.product_id,
            type: 'hold_released',
            delta: freshOrder.quantity,
            metadata: { orderId: freshOrder.id, reason: 'hold_expired_on_confirm' },
          },
          { transaction }
        );
      }

      await transaction.commit();

      await redis.del(`hold:${orderId}`);

      const err = new Error('Hold expired');
      err.status = 400;
      throw err;
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        // eslint-disable-next-line no-console
        console.error('Rollback error', rollbackErr);
      }
      throw err;
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const freshOrder = await Order.findOne({
      where: { id: orderId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!freshOrder || freshOrder.status !== 'pending') {
      await transaction.rollback();
      const err = new Error('Order cannot be confirmed');
      err.status = 400;
      throw err;
    }

    freshOrder.status = 'confirmed';
    await freshOrder.save({ transaction });

    await InventoryEvent.create(
      {
        product_id: freshOrder.product_id,
        type: 'order_confirmed',
        delta: 0,
        metadata: { orderId: freshOrder.id },
      },
      { transaction }
    );

    await transaction.commit();

    await redis.del(`hold:${orderId}`);

    return { status: 'confirmed' };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      // eslint-disable-next-line no-console
      console.error('Rollback error', rollbackErr);
    }
    throw err;
  }
}

async function getOrdersByEmail(email) {
  const orders = await Order.findAll({
    where: { customer_email: email },
    order: [['created_at', 'DESC']],
    include: [{ model: Product, as: 'product' }],
  });

  return orders.map((o) => ({
    id: o.id,
    product_id: o.product_id,
    product_name: o.product?.name,
    quantity: o.quantity,
    status: o.status,
    hold_expires_at: o.hold_expires_at,
    created_at: o.created_at,
  }));
}

async function getOrderByIdForUser(orderId, email) {
  const order = await Order.findOne({
    where: { id: orderId, customer_email: email },
    include: [{ model: Product, as: 'product' }],
  });
  if (!order) return null;
  return {
    id: order.id,
    product_id: order.product_id,
    product_name: order.product?.name,
    price: order.product?.price,
    quantity: order.quantity,
    status: order.status,
    hold_expires_at: order.hold_expires_at,
    created_at: order.created_at,
  };
}

module.exports = {
  createHold,
  confirmOrder,
  getOrdersByEmail,
  getOrderByIdForUser,
};


