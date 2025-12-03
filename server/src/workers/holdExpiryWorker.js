const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const cron = require('node-cron');
const { Op } = require('sequelize');
const { initSequelize, syncModels, getSequelize } = require('../config/sequelize');
const { Order, Product, InventoryEvent } = require('../models');
const { redis } = require('../utils/redisClient');

async function processExpiredHolds() {
  const now = new Date();
  const sequelize = getSequelize();

  const expiredOrders = await Order.findAll({
    where: {
      status: 'pending',
      hold_expires_at: { [Op.lte]: now },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Found ${expiredOrders.length} expired holds to process`);

  // Process each order in sequence to keep it simple
  // In real systems you might batch or parallelize with care.
  // eslint-disable-next-line no-restricted-syntax
  for (const order of expiredOrders) {
    // eslint-disable-next-line no-await-in-loop
    const transaction = await sequelize.transaction();
    try {
      // Reload with lock
      // eslint-disable-next-line no-await-in-loop
      const fresh = await Order.findOne({
        where: { id: order.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!fresh || fresh.status !== 'pending') {
        // eslint-disable-next-line no-await-in-loop
        await transaction.rollback();
        // eslint-disable-next-line no-continue
        continue;
      }

      fresh.status = 'expired';
      // eslint-disable-next-line no-await-in-loop
      await fresh.save({ transaction });

      // eslint-disable-next-line no-await-in-loop
      await Product.update(
        { total_stock: sequelize.literal(`total_stock + ${fresh.quantity}`) },
        { where: { id: fresh.product_id }, transaction }
      );

      // eslint-disable-next-line no-await-in-loop
      await InventoryEvent.create(
        {
          product_id: fresh.product_id,
          type: 'hold_released',
          delta: fresh.quantity,
          metadata: { orderId: fresh.id, reason: 'worker_expired' },
        },
        { transaction }
      );

      // eslint-disable-next-line no-await-in-loop
      await transaction.commit();

      // eslint-disable-next-line no-await-in-loop
      await redis.del(`hold:${fresh.id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error processing expired hold', err);
      // eslint-disable-next-line no-await-in-loop
      await transaction.rollback();
    }
  }
}

async function startWorker() {
  await initSequelize();
  await syncModels();

  // eslint-disable-next-line no-console
  console.log('Hold expiry worker started (runs every 30 seconds)');

  cron.schedule('*/30 * * * * *', processExpiredHolds);
}

startWorker().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start worker', err);
  process.exit(1);
});


