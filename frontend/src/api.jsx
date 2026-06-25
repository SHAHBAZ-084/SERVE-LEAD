import axios from 'axios';

const API_BASE = 'https://api.serveandlead.org';


const api = axios.create({
  baseURL: `${API_BASE}/api/`,
  withCredentials: true,
});

// Response interceptor for handling 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401)) {
      // Clear all auth data on session expiration
      localStorage.clear();
      // Force reload to login/home
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin-login')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Utility to resolve image URLs correctly.
 * If the path is already a full URL (GCP/Cloudinary), return as-is.
 * Otherwise, prefix with the API base URL for local development.
 */
export const getImgUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export { API_BASE };

export const withMultipartAuth = (auth) => {
  const headers = { ...(auth?.headers || {}) };
  delete headers['Content-Type'];
  delete headers['content-type'];
  return { ...auth, headers };
};

export default api;