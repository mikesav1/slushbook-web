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
      // ALWAYS prefer localStorage token (more reliable on mobile)
      const sessionToken = localStorage.getItem('session_token');
      const headers = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      console.log('[AuthContext] Checking auth...', {
        hasLocalStorageToken: !!sessionToken,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
        userAgent: navigator.userAgent.substring(0, 50)
      });
      
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      setUser(response.data);
      console.log('[AuthContext] User loaded from /auth/me:', response.data.email);
      
      // Re-save session token to ensure it's fresh
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token);
      }
    } catch (error) {
      console.log('[AuthContext] Auth check failed:', {
        status: error.response?.status,
        message: error.message,
        hasToken: !!localStorage.getItem('session_token')
      });
      
      // Only clear user if we're CERTAIN they're not logged in
      // 401 = Invalid/expired token (clear user)
      // 403 = Forbidden (clear user)
      // Network errors = Keep user (they might be offline)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[AuthContext] Session invalid, logging out');
        localStorage.removeItem('session_token');
        localStorage.removeItem('user_country');
        localStorage.removeItem('user_country_manual');
        localStorage.removeItem('user_country_timestamp');
        setUser(null);
      } else {
        console.warn('[AuthContext] Network/timeout error, keeping user logged in (offline mode)');
        // Try to load user from localStorage as fallback
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser && !user) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            console.log('[AuthContext] Loaded cached user (offline mode):', userData.email);
          } catch (e) {
            console.error('[AuthContext] Failed to parse cached user');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, skipAuthCheck = false) => {
    setUser(userData);
    console.log('[AuthContext] User logged in:', userData.email);
    
    // Stop any pending checkAuth calls after login to prevent immediate logout
    if (skipAuthCheck) {
      console.log('[AuthContext] Skipping immediate auth check after login');
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
