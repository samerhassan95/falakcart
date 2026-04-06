'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'affiliate' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (userData: Record<string, string>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/user');
        setUser(data.user);
      } else {
        // If not on login/register pages, redirect to login
        if (!window.location.pathname.match(/\/(login|register|refer|welcome)/)) {
           router.push('/login');
        }
      }
    } catch (err) {
      localStorage.removeItem('token');
      if (!window.location.pathname.match(/\/(login|register|refer|welcome)/)) {
           router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: Record<string, string>) => {
    const { data } = await api.post('/login', credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    
    if (data.user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const register = async (userData: Record<string, string>) => {
    const { data } = await api.post('/register', { ...userData, password_confirmation: userData.password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    router.push('/');
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
