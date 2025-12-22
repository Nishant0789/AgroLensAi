'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check for a token in localStorage or a cookie
    const mockUser = sessionStorage.getItem('mockUser');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
    }
    setLoading(false);
  }, []);

  const signIn = () => {
    const mockUser: User = {
      uid: '12345',
      email: 'farmer.joe@example.com',
      displayName: 'Farmer Joe',
      photoURL: 'https://picsum.photos/seed/101/40/40',
    };
    sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
    router.push('/');
  };

  const signOut = () => {
    sessionStorage.removeItem('mockUser');
    setUser(null);
    router.push('/auth');
  };

  const value = { user, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
