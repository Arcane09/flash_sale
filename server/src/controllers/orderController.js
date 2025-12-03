const orderService = require('../services/orderService');

async function createHold(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const customerEmail = req.user?.email || req.body.email;
    const role = req.user?.role;

    // Admins should not be able to place orders; they only monitor the system.
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot create orders.' });
    }
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email required' });
    }
    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ error: 'Invalid product or quantity' });
    }

    const result = await orderService.createHold({
      productId,
      quantity: qty,
      customerEmail,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function confirmOrder(req, res, next) {
  try {
    const { id } = req.params;
    const customerEmail = req.user?.email || req.body.email;
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email required' });
    }
    const result = await orderService.confirmOrder({
      orderId: Number(id),
      customerEmail,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    const email = req.query.email || req.user?.email;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    const orders = await orderService.getOrdersByEmail(email);
    return res.json(orders);
  } catch (err) {
    return next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const email = req.user?.email || req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    const order = await orderService.getOrderByIdForUser(Number(id), email);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createHold,
  confirmOrder,
  getOrders,
  getOrderById,
};


