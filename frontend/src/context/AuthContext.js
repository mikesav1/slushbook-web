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
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      console.log('[AuthContext] User loaded from /auth/me:', response.data.email);
    } catch (error) {
      // Not authenticated - user is null
      setUser(null);
      console.log('[AuthContext] Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    console.log('[AuthContext] User set via login:', userData.email);
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
      console.log('[AuthContext] Logged out, cleared session_token from localStorage');
    }
  };

  const isGuest = () => !user;
  const isPro = () => user?.role === 'pro' || user?.role === 'editor' || user?.role === 'admin';
  const isEditor = () => user?.role === 'editor' || user?.role === 'admin';
  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      checkAuth,
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
