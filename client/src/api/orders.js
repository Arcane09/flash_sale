import { apiClient } from './http';

export async function createHold({ productId, quantity }) {
  const res = await apiClient.post('/holds', { productId, quantity });
  return res.data;
}

export async function confirmOrder(orderId) {
  const res = await apiClient.post(`/orders/${orderId}/confirm`);
  return res.data;
}

export async function fetchOrder(orderId) {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data;
}

export async function fetchOrders() {
  const res = await apiClient.get('/orders');
  return res.data;
}


