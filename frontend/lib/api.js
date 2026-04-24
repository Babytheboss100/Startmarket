import axios from 'axios';
import { getToken, logout } from './auth';

// Prioritet: NEXT_PUBLIC_API_URL (build-time env) > localhost i dev > prod-default.
// Ingen localhost-fallback i prod-bygg — safe defaults.
function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  }
  return 'https://api.startmarket.no';
}

const api = axios.create({ baseURL: resolveBaseUrl() });
api.interceptors.request.use(config => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) logout();
  return Promise.reject(err);
});
export default api;

// Eksporter også for direkte bruk (f.eks. window.location.href for OAuth-redirects)
export const API_BASE = resolveBaseUrl();
