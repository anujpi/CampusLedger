import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setToken, setOnUnauthorized } from "./api";

interface User {
  email: string;
  fullName: string;
  role: "ADMIN" | "STUDENT";
  mustChangePassword: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Try restore session
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; role: string; mustChangePassword: boolean }>(
      "/api/auth/login",
      { method: "POST", body: { email, password } }
    );
    setToken(res.token);
    await refreshUser();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    await refreshUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
