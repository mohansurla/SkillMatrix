import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sm_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.data.user);
          localStorage.setItem('sm_user', JSON.stringify(res.data.data.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verify();
  }, []); // eslint-disable-line

  const login = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('sm_user', JSON.stringify(userData));
    localStorage.setItem('sm_token', tokenData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sm_user');
    localStorage.removeItem('sm_token');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sm_user', JSON.stringify(updatedUser));
  }, []);

  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isStudent, isMentor, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
