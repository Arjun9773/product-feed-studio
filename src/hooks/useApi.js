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

  // Use activeStoreId (super_admin viewing a store) or own store_id
  const storeId = localStorage.getItem('activeStoreId') || localStorage.getItem('store_id');
  if (storeId) {
    config.headers['x-tenant-id'] = storeId;
  }

  return config;
});

export default API;
