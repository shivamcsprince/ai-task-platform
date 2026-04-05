import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — handle 401 globally ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Tasks API ────────────────────────────────────────────────────────────
export const tasksAPI = {
  create: (data) => api.post('/tasks', data),
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  run: (id) => api.post(`/tasks/${id}/run`),
  logs: (id) => api.get(`/tasks/${id}/logs`),
};

export default api;
