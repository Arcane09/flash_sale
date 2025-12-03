import { apiClient } from './http';

const STORAGE_KEY = 'flashsale_token';
const USER_KEY = 'flashsale_user';

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginApi({ email, password }) {
  const res = await apiClient.post('/auth/login', { email, password });
  const { token, user } = res.data;
  setAuth(token, user);
  return user;
}

export async function registerApi({ email, password }) {
  const res = await apiClient.post('/auth/register', { email, password });
  const { token, user } = res.data;
  setAuth(token, user);
  return user;
}


