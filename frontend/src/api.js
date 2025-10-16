import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { username: email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const imagesAPI = {
  upload: (formData) => api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyImages: () => api.get('/images/my-images'),
};

export const facesAPI = {
  verify: (data) => api.post('/faces/verify', data),
  compare: (data) => api.post('/faces/compare', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateThreshold: (threshold) => api.patch('/users/threshold', { threshold }),
};

export default api;