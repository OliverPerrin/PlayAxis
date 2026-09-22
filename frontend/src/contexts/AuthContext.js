import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  useEffect(() => {
    let active = true;
    const expire = () => {
      setUser(null);
      api.clearCache();
    };
    window.addEventListener("session-expired", expire);
    if (!localStorage.getItem("token")) setLoading(false);
    else
      api
        .getMe()
        .then((me) => {
          if (active) setUser(me);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
      window.removeEventListener("session-expired", expire);
    };
  }, []);
  const login = async (username, password) => {
    const res = await api.login(username, password);
    localStorage.setItem("token", res.access_token);
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch (error) {
      localStorage.removeItem("token");
      throw error;
    }
  };
  const logout = () => {
    localStorage.removeItem("token");
    api.clearCache();
    setUser(null);
  };
  const refresh = async () => {
    const me = await api.getMe();
    setUser(me);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, login, register: api.register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
