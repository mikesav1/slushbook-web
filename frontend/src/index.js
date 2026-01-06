import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "@/App";

// Global axios interceptor to add Authorization header from localStorage
// This fixes authentication on custom domains where cookies don't work cross-domain
axios.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login/signup requests
    const isAuthRequest = config.url?.includes('/auth/login') || 
                         config.url?.includes('/auth/signup') || 
                         config.url?.endsWith('/auth/login') || 
                         config.url?.endsWith('/auth/signup');
    
    // Only add session token if no Authorization header is already set and it's not an auth request
    if (!isAuthRequest && !config.headers.Authorization) {
      const token = localStorage.getItem('session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors  
// Only clear session on 401 from authenticated endpoints, not auth requests
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/signup');
    
    // Only clear session token if 401 comes from authenticated endpoint (not login/signup)
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('session_token');
      console.log('[Axios] 401 from authenticated endpoint - cleared session_token');
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
