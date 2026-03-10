import { AuthContext } from "./AuthContext";
import React, { useState, useEffect } from "react";
import api from "../../services/api/api";
import { setAccessToken } from "../../services/auth/tokenStorage";
import type { User } from "./AuthContext";
import { refreshApi } from "../../services/api/auth.api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken);
    setUser(userData);
    setIsAuth(true);
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error(error);
    }

    setAccessToken(null);
    setUser(null);
    setIsAuth(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { accessToken, user } = await refreshApi();

        setAccessToken(accessToken);
        setUser(user);
        setIsAuth(true);
      } catch {
        setAccessToken(null);
        setUser(null);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
