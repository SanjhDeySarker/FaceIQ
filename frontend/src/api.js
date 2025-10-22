import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  register: async (userData) => {
    const formData = new URLSearchParams();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
};

// Images API - SIMPLIFIED
export const imagesAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Uploading file:', file.name, file.type, file.size);
    
    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getMyImages: async () => {
    return api.get('/images/my-images');
  },
};

// Faces API - SIMPLIFIED
export const facesAPI = {
  compare: async (image1, image2, threshold = 75.0) => {
    const formData = new FormData();
    formData.append('image1', image1);
    formData.append('image2', image2);
    formData.append('threshold', threshold.toString());
    
    console.log('Comparing images:', image1.name, image2.name);
    
    return api.post('/faces/compare', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return api.get('/users/profile');
  },

  updateThreshold: async (threshold) => {
    return api.patch('/users/threshold', { threshold });
  },
};

// Mock API for testing
export const mockAPI = {
  upload: async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            image_id: 'mock_img_' + Date.now(),
            file_name: file.name,
            file_url: '/uploads/mock.jpg',
            face_count: 2,
            faces: [
              {
                face_id: 'face_1',
                bbox: [100, 100, 200, 200],
                confidence: 0.98,
                age: 25,
                gender: 'male',
                quality: 0.9
              },
              {
                face_id: 'face_2', 
                bbox: [400, 150, 180, 180],
                confidence: 0.96,
                age: 30,
                gender: 'female',
                quality: 0.8
              }
            ],
            upload_time: new Date().toISOString()
          }
        });
      }, 2000);
    });
  },

  compare: async (image1, image2) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            similarity_score: 85.2,
            threshold_used: 75.0,
            match_status: 'MATCH',
            probe_confidence: 0.99,
            candidate_confidence: 0.97,
            message: 'Comparison completed successfully'
          }
        });
      }, 3000);
    });
  }
};

// Utility to get error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export default api;