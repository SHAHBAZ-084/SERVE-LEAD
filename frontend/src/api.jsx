import axios from 'axios';

const API_BASE = 'https://api.serveandlead.org';


const api = axios.create({
  baseURL: `${API_BASE}/api/`,
  withCredentials: true,
});

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
export default api;