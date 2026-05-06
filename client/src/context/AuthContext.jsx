import { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [toast, setToast] = useState('');

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('takeback_token');
    const savedUser = localStorage.getItem('takeback_user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsed);
        setAuthToken(savedToken);
      } catch {
        localStorage.removeItem('takeback_token');
        localStorage.removeItem('takeback_user');
      }
    }
  }, []);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    localStorage.setItem('takeback_token', authToken);
    localStorage.setItem('takeback_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('takeback_token');
    localStorage.removeItem('takeback_user');
    setToast("You've been logged out");
  };

  const updateWallet = (newBalance) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, wallet: newBalance };
      localStorage.setItem('takeback_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateWallet, toast }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
