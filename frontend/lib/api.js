import axios from 'axios';
import { getToken, logout } from './auth';
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' });
api.interceptors.request.use(config => { const t = getToken(); if (t) config.headers.Authorization = `Bearer ${t}`; return config; });
api.interceptors.response.use(r => r, err => { if (err.response?.status === 401) logout(); return Promise.reject(err); });
export default api;
