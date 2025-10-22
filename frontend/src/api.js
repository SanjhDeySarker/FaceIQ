import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Redirect to login page if we're not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const formData = new FormData();
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      
      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },
};

// Images API
export const imagesAPI = {
  upload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        },
      });
      
      return response;
    } catch (error) {
      console.error('Image upload API error:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please try again with a smaller file.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Please select a smaller image.');
      } else if (error.response?.status === 415) {
        throw new Error('Unsupported file type. Please use JPEG, PNG, or JPG.');
      }
      
      throw error;
    }
  },

  getMyImages: async () => {
    try {
      const response = await api.get('/images/my-images');
      return response;
    } catch (error) {
      console.error('Get images API error:', error);
      throw error;
    }
  },

  deleteImage: async (imageId) => {
    try {
      const response = await api.delete(`/images/${imageId}`);
      return response;
    } catch (error) {
      console.error('Delete image API error:', error);
      throw error;
    }
  },
};

// Faces API
export const facesAPI = {
  verify: async (data) => {
    try {
      const response = await api.post('/faces/verify', data);
      return response;
    } catch (error) {
      console.error('Face verify API error:', error);
      throw error;
    }
  },

  compare: async (image1, image2, threshold = 75.0) => {
    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);
      formData.append('threshold', threshold.toString());
      
      const response = await api.post('/faces/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for face comparison
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Comparison Upload Progress: ${percentCompleted}%`);
          }
        },
      });
      
      return response;
    } catch (error) {
      console.error('Face compare API error:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED') {
        throw new Error('Comparison timeout. Please try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid images provided. Please try with different images.');
      }
      
      throw error;
    }
  },

  detect: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post('/faces/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000, // 45 seconds for face detection
      });
      
      return response;
    } catch (error) {
      console.error('Face detect API error:', error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/users/profile', profileData);
      return response;
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },

  updateThreshold: async (threshold) => {
    try {
      const response = await api.patch('/users/threshold', { threshold });
      return response;
    } catch (error) {
      console.error('Update threshold API error:', error);
      throw error;
    }
  },

  getApiKey: async () => {
    try {
      const response = await api.get('/users/api-key');
      return response;
    } catch (error) {
      console.error('Get API key error:', error);
      throw error;
    }
  },

  regenerateApiKey: async () => {
    try {
      const response = await api.post('/users/regenerate-api-key');
      return response;
    } catch (error) {
      console.error('Regenerate API key error:', error);
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  // Extract error message from various error formats
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.detail) return error.response.data.detail;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('access_token');
  },

  // Set auth token
  setToken: (token) => {
    localStorage.setItem('access_token', token);
  },

  // Remove auth token (logout)
  removeToken: () => {
    localStorage.removeItem('access_token');
  },

  // Validate file before upload
  validateFile: (file, maxSizeMB = 10) => {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Please select an image file (JPEG, PNG, JPG, etc.)');
    }
    
    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};

// Mock data for development (fallback when backend is not available)
export const mockAPI = {
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          resolve({
            data: {
              access_token: 'mock-jwt-token-' + Date.now(),
              token_type: 'bearer'
            }
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  },

  register: async (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: 'mock-user-' + Date.now(),
            email: userData.email,
            api_key: 'mock-api-key-' + Date.now(),
            threshold: 75.0,
            created_at: new Date().toISOString()
          }
        });
      }, 1000);
    });
  },

  uploadImage: async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            image_id: 'img_' + Date.now(),
            face_count: Math.floor(Math.random() * 3) + 1,
            faces: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
              face_id: 'face_' + Date.now() + '_' + i,
              bbox: [100 + i * 50, 100, 200, 200],
              confidence: 0.85 + Math.random() * 0.14,
              age: 20 + Math.floor(Math.random() * 40),
              gender: Math.random() > 0.5 ? 'male' : 'female',
              quality: 0.7 + Math.random() * 0.3
            }))
          }
        });
      }, 2000);
    });
  },

  compareFaces: async (image1, image2) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const similarity = 50 + Math.random() * 50; // 50-100% similarity
        resolve({
          data: {
            similarity_score: Math.round(similarity * 100) / 100,
            threshold_used: 75.0,
            match_status: similarity >= 75 ? 'MATCH' : 'NOT_MATCH',
            probe_confidence: 0.95,
            candidate_confidence: 0.95
          }
        });
      }, 3000);
    });
  }
};

// Export the main api instance
export default api;