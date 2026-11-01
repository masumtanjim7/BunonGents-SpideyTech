'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, UserProfile } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register', onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  loginSuccess: (userData: UserProfile, tokenStr: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('bunon_user_token');
      const savedUser = localStorage.getItem('bunon_user_profile');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    }
  }, []);

  const openAuthModal = (
    mode: 'login' | 'register' = 'register',
    onSuccess?: () => void
  ) => {
    setAuthModalMode(mode);
    if (onSuccess) {
      setPendingAction(() => onSuccess);
    } else {
      setPendingAction(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const loginSuccess = (userData: UserProfile, tokenStr: string) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('bunon_user_token', tokenStr);
    localStorage.setItem('bunon_user_profile', JSON.stringify(userData));
    setIsAuthModalOpen(false);

    if (pendingAction) {
      const callback = pendingAction;
      setPendingAction(null);
      setTimeout(() => callback(), 100);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bunon_user_token');
    localStorage.removeItem('bunon_user_profile');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('bunon_user_profile', JSON.stringify(data));
      } else if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginSuccess,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
