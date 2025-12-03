import { apiClient } from './http';

export async function fetchLiveProducts() {
  const res = await apiClient.get('/products/live');
  return res.data;
}

export async function fetchAdminMetrics() {
  const res = await apiClient.get('/admin/metrics');
  return res.data;
}

export async function fetchAdminProducts() {
  const res = await apiClient.get('/admin/products');
  return res.data;
}


