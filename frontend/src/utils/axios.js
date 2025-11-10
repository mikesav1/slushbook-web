/**
 * Axios instance with authentication interceptor
 * 
 * Automatically adds session_token from localStorage to all requests
 * This fixes admin authentication issues on custom domains where cookies don't work
 */

import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API,
  withCredentials: true, // Still try cookies as fallback
});

// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    // Get session_token from localStorage
    const token = localStorage.getItem('session_token');
    
    if (token) {
      // Add Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      localStorage.removeItem('session_token');
      console.log('[Axios] 401 Unauthorized - cleared session_token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
