import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "@/index.css";
import App from "@/App";

// Global axios interceptor to add Authorization header from localStorage
// This fixes admin authentication issues on custom domains where cookies don't work
axios.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login/signup requests (more robust matching)
    const isAuthRequest = config.url?.includes('/auth/login') || 
                         config.url?.includes('/auth/signup') || 
                         config.url?.endsWith('/auth/login') || 
                         config.url?.endsWith('/auth/signup');
    
    console.log('[Axios Interceptor] URL:', config.url, 'isAuthRequest:', isAuthRequest);
    
    // Only add session token if no Authorization header is already set and it's not an auth request
    if (!isAuthRequest && !config.headers.Authorization) {
      const token = localStorage.getItem('session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[Axios Interceptor] Added Authorization header');
      }
    } else {
      console.log('[Axios Interceptor] Skipped Authorization header (isAuthRequest:', isAuthRequest, ')');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      console.log('[Axios] 401 Unauthorized - cleared session_token');
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
