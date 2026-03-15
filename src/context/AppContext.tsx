import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, RecommendationResult } from '../types';
import { MOCK_USERS } from '../mocks/users';

interface AppState {
  user: User | null;
  pendingResult: RecommendationResult | null;
  darkMode: boolean;
}

interface AppContextValue extends AppState {
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setPendingResult: (r: RecommendationResult | null) => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SESSION_KEY = 'sireme_session';

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);
  const [pendingResult, setPendingResult] = useState<RecommendationResult | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const login = useCallback((email: string, password: string): boolean => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, email: _em, ...userObj } = found;
    setUser(userObj);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(v => !v);
  }, []);

  return (
    <AppContext.Provider value={{ user, pendingResult, darkMode, login, logout, setPendingResult, toggleDarkMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
