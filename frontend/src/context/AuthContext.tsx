import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ApiError, apiFetch } from "../lib/api";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, fullName: string, acceptedTerms: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch("/auth/me")
      .then((data) => setUser(data.user))
      // A network or deployment problem must not sign a customer out. Only the
      // API can invalidate a session by explicitly returning 401/403.
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          localStorage.removeItem("token");
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  setUser(data.user);
  return data.user;
}

  async function signup(email: string, password: string, fullName: string, acceptedTerms: boolean) {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName, acceptedTerms }),
    });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
