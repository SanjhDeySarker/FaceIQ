import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
      error.message = 'Request timeout - Backend might be down';
    } else if (error.response?.status === 404) {
      error.message = 'Endpoint not found: ' + error.config.url;
    } else if (error.response?.status === 500) {
      error.message = 'Server error - Check backend logs';
    } else if (!error.response) {
      error.message = 'Cannot connect to backend server - Make sure it\'s running on http://localhost:8000';
    }
    
    return Promise.reject(error);
  }
);

// Test backend connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await api.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return { 
      success: false, 
      error: getErrorMessage(error),
      details: error.message 
    };
  }
};

// Images API - CORRECTED ENDPOINTS
export const imagesAPI = {
  upload: async (file) => {
    console.log('📤 Starting file upload:', file.name, file.size, file.type);
    
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Upload Progress: ${percentCompleted}%`);
        }
      }
    });
  },

  getMyImages: async () => {
    return api.get('/images');
  },
};

// Faces API
export const facesAPI = {
  compare: async (image1, image2, threshold = 75.0) => {
    const formData = new FormData();
    formData.append('image1', image1);
    formData.append('image2', image2);
    formData.append('threshold', threshold.toString());
    
    return api.post('/compare', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return api.get('/users/me');
  },
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    return api.post('/auth/login', {
      email: email,
      password: password
    });
  },
};

// Mock API for fallback
export const mockAPI = {
  upload: async (file) => {
    console.log('🔄 Using mock upload API - Backend might be unavailable');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const faceCount = Math.floor(Math.random() * 3) + 1;
    const faces = Array.from({ length: faceCount }, (_, i) => ({
      face_id: `mock_face_${Date.now()}_${i}`,
      bbox: [50 + i * 150, 50, 120, 120],
      confidence: 0.85 + Math.random() * 0.1,
      age: 20 + Math.floor(Math.random() * 40),
      gender: Math.random() > 0.5 ? 'male' : 'female',
      quality: 0.7 + Math.random() * 0.2,
    }));
    
    return {
      data: {
        image_id: `mock_img_${Date.now()}`,
        file_name: file.name,
        file_size: file.size,
        file_url: `mock://uploads/${file.name}`,
        face_count: faceCount,
        faces: faces,
        upload_time: new Date().toISOString(),
        message: 'Mock analysis complete - Backend server might be down'
      }
    };
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