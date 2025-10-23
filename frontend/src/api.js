import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
   
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check if the backend is running.';
    } else if (error.response?.status === 404) {
      error.message = 'API endpoint not found. Please check the backend server.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please check backend logs.';
    } else if (!error.response) {
      error.message = 'Cannot connect to server. Make sure backend is running on http://localhost:8000';
    }
   
    return Promise.reject(error);
  }
);

// Test backend connection - FIXED THIS LINE
export const testConnection = async () => {
  try {
    const response = await api.get('/health'); // Remove the leading slash to use baseURL properly
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error.message
    };
  }
};

// Images API
export const imagesAPI = {
  upload: async (file) => {
    console.log('📤 Starting file upload:', file.name, file.size, file.type);
   
    const formData = new FormData();
    formData.append('file', file);
   
    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
  },

  getMyImages: async () => {
    return api.get('/images/my-images');
  },
};

// Faces API
export const facesAPI = {
  compare: async (image1, image2, threshold = 75.0) => {
    const formData = new FormData();
    formData.append('image1', image1);
    formData.append('image2', image2);
    formData.append('threshold', threshold.toString());
   
    return api.post('/faces/compare', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users API - ADDED THIS MISSING EXPORT
export const usersAPI = {
  getProfile: async () => {
    return api.get('/users/profile');
  },

  updateProfile: async (userData) => {
    return api.put('/users/profile', userData);
  },

  changePassword: async (currentPassword, newPassword) => {
    return api.put('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },

  deleteAccount: async () => {
    return api.delete('/users/account');
  },

  getUsageStats: async () => {
    return api.get('/users/usage-stats');
  }
};

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

// Mock API for fallback
export const mockAPI = {
  upload: async (file) => {
    console.log('🔄 Using mock upload API');
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
            upload_time: new Date().toISOString(),
            message: 'Mock upload successful - Backend might be down'
          }
        });
      }, 1500);
    });
  },

  // Mock users API for fallback
  users: {
    getProfile: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: 'mock_user_1',
              email: 'demo@example.com',
              created_at: new Date().toISOString(),
              image_count: 5,
              face_detection_count: 12,
              subscription: 'free'
            }
          });
        }, 1000);
      });
    }
  }
};

// Utility function
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export default api;