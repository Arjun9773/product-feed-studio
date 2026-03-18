import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Auto-attach JWT token and x-tenant-id on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Use activeStoreId (super_admin viewing a store) or own storeId
  const storeId = localStorage.getItem('activeStoreId') || localStorage.getItem('storeId');
  if (storeId) {
    config.headers['x-tenant-id'] = storeId;
  }

  return config;
});

// Auto logout when token is expired or invalid
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;