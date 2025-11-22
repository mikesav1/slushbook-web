import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API } from '../App';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AuthContext] Checking auth...');
      
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        timeout: 10000
      });
      
      setUser(response.data);
      console.log('[AuthContext] User loaded:', response.data.email);
      
      // Store session token in localStorage for reference
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token);
      }
    } catch (error) {
      console.log('[AuthContext] Auth check failed:', error.response?.status || error.message);
      
      // Clear session on 401/403
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('session_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    console.log('[AuthContext] User logged in:', userData.email);
    
    // Store session token
    if (userData.session_token) {
      localStorage.setItem('session_token', userData.session_token);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state AND localStorage
      setUser(null);
      localStorage.removeItem('session_token');
      localStorage.removeItem('cached_user');
      
      // Reset language to Danish (default) on logout
      localStorage.removeItem('user_language');
      localStorage.removeItem('user_country');
      localStorage.removeItem('user_country_manual');
      localStorage.removeItem('user_country_timestamp');
      
      // Change i18n back to Danish
      if (window.i18n) {
        window.i18n.changeLanguage('da');
      }
      
      console.log('[AuthContext] Logged out, cleared session and language preferences');
    }
  };

  const isGuest = () => !user || user?.role === 'guest';
  const isPro = () => user?.role === 'pro' || user?.role === 'editor' || user?.role === 'admin';
  const isEditor = () => user?.role === 'editor' || user?.role === 'admin';
  const isAdmin = () => user?.role === 'admin';

  // Update user's completed tours (called after tour completion)
  const updateCompletedTours = (tourId) => {
    if (user) {
      setUser({
        ...user,
        completed_tours: [...(user.completed_tours || []), tourId]
      });
      console.log('[AuthContext] Updated completed_tours with:', tourId);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      checkAuth,
      updateCompletedTours,
      isGuest,
      isPro,
      isEditor,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
