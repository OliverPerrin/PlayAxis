import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Here you could add logic to validate the token and fetch user data
      setUser({ token });
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      setUser({ token: data.access_token });
      return data;
    }
    throw new Error('Login failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);