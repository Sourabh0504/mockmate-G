import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth and redirect to login
      localStorage.removeItem('mm_token');
      localStorage.removeItem('mm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateVoice: (data) => api.patch('/auth/voice', data),
  deleteAccount: () => api.delete('/auth/account'),
};

// ── Resumes ───────────────────────────────────────────────────────────────────
export const resumeApi = {
  list: () => api.get('/resumes/'),
  upload: (formData) =>
    api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (resumeId) => api.delete(`/resumes/${resumeId}`),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionApi = {
  list: () => api.get('/sessions/'),
  create: (data) => api.post('/sessions/', data),
  get: (sessionId) => api.get(`/sessions/${sessionId}`),
  getQuestions: (sessionId) => api.get(`/sessions/${sessionId}`), // questions are embedded in session doc
  end: (sessionId, durationActual) => api.post(`/sessions/${sessionId}/end`, { duration_actual: durationActual }),
  getReport: (sessionId) => api.get(`/sessions/${sessionId}/report`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  listAllSessions: (skip = 0, limit = 50) => api.get(`/admin/sessions?skip=${skip}&limit=${limit}`),
  getSessionDetails: (sessionId) => api.get(`/admin/sessions/${sessionId}`),
};

export default api;
