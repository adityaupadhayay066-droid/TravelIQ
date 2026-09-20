import axios from 'axios';

export const getBackendURL = () => {
  return '/api';
};

export const getBackendBaseURL = () => {
  return '';
};

export const getAiServiceURL = () => {
  return '/ai';
};

// ─── Auth endpoints that should NOT trigger silent refresh ───
const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/admin/login',
  '/auth/admin/register',
  '/auth/admin/verify-2fa',
  '/auth/admin/verify-otp',
  '/auth/verify-2fa',
  '/auth/passkey/login-challenge',
  '/auth/passkey/login-verify',
  '/auth/logout'
];

function shouldSkipRefresh(url) {
  return AUTH_SKIP_REFRESH.some(path => url === path || url.endsWith(path));
}

// ─── Backend API (Express on port 5000) ───
const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Global response error handler & Silent Refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (error.code === 'ECONNABORTED') {
      console.warn('[API] Request timed out');
    } else if (!error.response) {
      console.warn('[API] Network error — backend may be offline');
    } else if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(requestUrl)
    ) {
      // ─── Token Refresh Logic (only for protected routes) ───
      originalRequest._retry = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('userInfo');
        window.dispatchEvent(new Event('auth_logout'));
        return Promise.reject(refreshError);
      }
    }
    // For auth endpoints, just pass the error through — AuthContext handles it
    return Promise.reject(error);
  }
);

// ─── AI Service API (FastAPI on port 8000) ───
const aiApi = axios.create({
  baseURL: getAiServiceURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('[AI Service] Network error — AI service may be offline');
    }
    return Promise.reject(error);
  }
);

// ─── Retry helper ───
export async function withRetry(fn, retries = 2, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 1.5;
    }
  }
}

export { api, aiApi };
export default api;
