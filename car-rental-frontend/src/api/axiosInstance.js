import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
});

// Tự động gắn JWT vào mọi request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh token khi 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // gọi /auth/refresh rồi retry request gốc
    }
    return Promise.reject(err);
  }
);

export default api;