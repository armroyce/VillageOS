import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const villageId = localStorage.getItem('village_id');
  if (villageId) config.headers['x-village-id'] = villageId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const isSuperAdmin = user?.is_super_admin;
      localStorage.clear();
      window.location.href = isSuperAdmin ? '/super/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
