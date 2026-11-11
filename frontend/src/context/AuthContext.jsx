import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sehatsetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('sehatsetu_token') || null;
  });
  const [loading, setLoading] = useState(true);

  // Validate existing token on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sehatsetu_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('sehatsetu_user', JSON.stringify(profile));
        } catch (err) {
          console.error("Token verification failed, clearing auth state:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    setToken(data.access_token);
    localStorage.setItem('sehatsetu_token', data.access_token);
    
    // Fetch full profile
    const profile = await authApi.getMe();
    setUser(profile);
    localStorage.setItem('sehatsetu_user', JSON.stringify(profile));
    return profile;
  };

  const register = async (payload) => {
    const newUser = await authApi.register(payload);
    // After registration, auto login
    const loginData = await authApi.login(payload.phone, payload.password);
    setToken(loginData.access_token);
    localStorage.setItem('sehatsetu_token', loginData.access_token);
    setUser(newUser);
    localStorage.setItem('sehatsetu_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sehatsetu_token');
    localStorage.removeItem('sehatsetu_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        role: user?.role,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

