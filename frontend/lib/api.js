import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Axios instance with JWT interceptors for authenticated API calls
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('peblo_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('peblo_token');
      localStorage.removeItem('peblo_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Notes API ───────────────────────────────────────────
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.patch(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  toggleArchive: (id) => api.patch(`/notes/${id}/archive`),
  generateSummary: (id) => api.post(`/notes/${id}/generate-summary`),
  toggleShare: (id) => api.post(`/notes/${id}/share`),
  getTags: () => api.get('/notes/tags'),
};

// ─── Shared API ──────────────────────────────────────────
export const sharedAPI = {
  getNote: (shareId) => api.get(`/shared/${shareId}`),
};

// ─── Insights API ────────────────────────────────────────
export const insightsAPI = {
  get: () => api.get('/insights'),
};

export default api;
