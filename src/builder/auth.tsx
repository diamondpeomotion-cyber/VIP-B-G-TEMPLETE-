import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import type { OwnerUser, Salon } from './types';

interface AuthContextValue {
  user: OwnerUser | null;
  salon: Salon | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSession: (user: OwnerUser, salon: Salon | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  salon: null,
  loading: true,
  refresh: async () => {},
  setSession: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OwnerUser | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: OwnerUser | null; salon: Salon | null }>('/api/auth/me');
      setUser(data.user);
      setSalon(data.salon);
    } catch {
      setUser(null);
      setSalon(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setSession = useCallback((u: OwnerUser, s: Salon | null) => {
    setUser(u);
    setSalon(s);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      setSalon(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, salon, loading, refresh, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
