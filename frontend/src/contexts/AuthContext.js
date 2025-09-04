import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async (_username, _password) => { throw new Error('Auth not initialized'); },
  register: async (_username, _email, _password) => { throw new Error('Auth not initialized'); },
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // On mount, try to restore session
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const me = await api.getMe().catch(() => null);
        if (mounted && me) setUser(me);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    const token = res?.access_token || res?.token;
    if (!token) throw new Error('Login failed: no token returned');
    localStorage.setItem('token', token);
    // Fetch user profile if available
    const me = await api.getMe().catch(() => null);
    setUser(me || { username });
    return me || { username };
  };

  const register = async (username, email, password) => {
    await api.register(username, email, password);
    return true; // Do not auto-login; let UI switch to Sign In
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};