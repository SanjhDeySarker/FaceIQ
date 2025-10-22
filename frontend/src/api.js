import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Mock API for frontend development
export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  register: async (userData) => {
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    
    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
};

export const imagesAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getMyImages: async () => {
    return { data: [] }; // Mock response
  },
};

export const facesAPI = {
  verify: async (data) => {
    return { data: {
      similarity_score: 85.2,
      threshold_used: 75.0,
      match_status: 'MATCH',
      probe_confidence: 0.99,
      candidate_confidence: 0.97
    }};
  },

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

export const usersAPI = {
  getProfile: async () => {
    return { data: {
      id: "mock-user-id",
      email: "user@example.com",
      api_key: "mock-api-key-123",
      threshold: 75.0,
      created_at: new Date().toISOString()
    }};
  },

  updateThreshold: async (threshold) => {
    return { data: { message: "Threshold updated successfully", new_threshold: threshold }};
  },
};

export default api;