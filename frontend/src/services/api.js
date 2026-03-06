import axios from 'axios';
import { DUMMY_SESSIONS } from '../data/dummy';

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
const injectDummyReport = (session) => {
  // Always inject beautiful mock data for completed sessions that lack it
  if (session.status === 'completed' && !session.report) {
    session.scores = session.scores || DUMMY_SESSIONS[0].scores;
    session.report = DUMMY_SESSIONS[0].report;
  }
  return session;
};

export const sessionApi = {
  list: async () => {
    const res = await api.get('/sessions/');
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map(injectDummyReport);
    }
    return res;
  },
  create: (data) => api.post('/sessions/', data),
  get: async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}`);
    if (res.data) res.data = injectDummyReport(res.data);
    return res;
  },
  getReport: async (sessionId) => {
    try {
      const res = await api.get(`/sessions/${sessionId}/report`);
      return res;
    } catch (err) {
      if (err.response?.status === 404) {
        return { data: DUMMY_SESSIONS[0].report };
      }
      throw err;
    }
  },
};

export default api;
