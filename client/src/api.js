import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

// Set or clear the Authorization header
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ── Auth ──────────────────────────────────────────
export const googleAuth = (credential) =>
  api.post('/api/auth/google', { credential });

export const getMe = () =>
  api.get('/api/auth/me');

// ── Cups ──────────────────────────────────────────
export const getCup = (cupId) =>
  api.get(`/api/cups/${cupId}`);

export const borrowCup = (cupId) =>
  api.post('/api/cups/borrow', { cupId });

export const returnCup = (cupId) =>
  api.post('/api/cups/return', { cupId });

// ── Admin ─────────────────────────────────────────
const adminHeaders = { 'x-admin-key': 'takeback-admin-2024' };

export const getAdminCups = (filter) =>
  api.get('/api/admin/cups', { headers: adminHeaders, params: filter ? { status: filter } : undefined });

export const getCupStats = () =>
  api.get('/api/admin/cups/stats', { headers: adminHeaders });

export const verifyCupReturn = (cupId) =>
  api.patch(`/api/admin/cups/${cupId}/verify`, {}, { headers: adminHeaders });

export const markCupReturned = (cupId) =>
  api.patch(`/api/admin/cups/${cupId}/mark-returned`, {}, { headers: adminHeaders });

export const getAdminUsers = () =>
  api.get('/api/admin/users', { headers: adminHeaders });

export const getAdminTransactions = () =>
  api.get('/api/admin/transactions', { headers: adminHeaders });

export default api;
