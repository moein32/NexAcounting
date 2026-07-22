import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useTheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <BrowserRouter>{children}</BrowserRouter>;
}

