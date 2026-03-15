'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isStreamer: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateUser: (updated: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'streamvibe_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<{ error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      setUser(data.user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  async function register(username: string, email: string, password: string): Promise<{ error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Registration failed' };
      setUser(data.user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  // Update user in both state and localStorage — no page reload needed
  function updateUser(updated: AuthUser) {
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}