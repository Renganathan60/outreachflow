import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('outreachflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('outreachflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('outreachflow_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('outreachflow_token', data.token);
    localStorage.setItem('outreachflow_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, role = 'SALES_USER') => {
    const data = await authService.register({ name, email, password, role });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('outreachflow_token', data.token);
    localStorage.setItem('outreachflow_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('outreachflow_token');
    localStorage.removeItem('outreachflow_user');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
