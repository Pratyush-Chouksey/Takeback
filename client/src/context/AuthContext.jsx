import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, setAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;

    const verifyAndRestore = async () => {
      const savedToken = localStorage.getItem('takeback_token');
      const savedUser = JSON.parse(localStorage.getItem('takeback_user') || 'null');

      if (!savedToken) {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        setAuthToken(savedToken);
        const r = await getMe();

        if (!cancelled) {
          setUser(r.data.user || savedUser || null);
          setToken(savedToken);
          setLoading(false);
        }
      } catch (e) {
        const status = e.response?.status;
        if (status === 401 && !cancelled) {
          localStorage.removeItem('takeback_token');
          localStorage.removeItem('takeback_user');
          setAuthToken(null);
          setUser(null);
          setToken(null);
        }

        if (!cancelled) setLoading(false);
      }
    };

    verifyAndRestore();
    return () => { cancelled = true; };
  }, []);

  const login = (userData, authToken) => {
    // userData: { name, email, picture, wallet }
    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    localStorage.setItem('takeback_token', authToken);
    localStorage.setItem('takeback_user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('takeback_token');
    localStorage.removeItem('takeback_user');
    sessionStorage.removeItem('takeback_redirect');
    setAuthToken(null);
    setUser(null);
    setToken(null);

    // Hard redirect is most reliable and clears stale UI state.
    window.location.href = '/';
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
    <AuthContext.Provider value={{ user, token, login, logout, updateWallet, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
