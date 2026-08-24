'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  projectIds: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

/** Decode the JWT `exp` claim (seconds since epoch) without a library. Returns ms or null. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '='; // atob requires correct padding
    const decoded = JSON.parse(atob(b64));
    return typeof decoded?.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Holds the expiry-check timer so we can clear it between logins/logouts.
  const expiryTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  // Annul any previous expiry timer.
  const clearExpiryTimer = () => {
    if (expiryTimer.current) {
      window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const expiresAt = getTokenExpiry(storedToken);
          // If the token is already expired (or unparseable), clear the session.
          if (expiresAt === null || expiresAt <= Date.now()) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          } else {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            armExpiryTimer(expiresAt);
          }
        }
      } catch (error) {
        console.error('Failed to restore auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    // Auto-logout at the exact moment the JWT expires, so the app never keeps a
    // session that the backend would reject.
    const armExpiryTimer = (expiresAt: number) => {
      clearExpiryTimer();
      const delay = Math.max(0, expiresAt - Date.now());
      // Cap delay to the max setTimeout value to avoid overflow issues.
      expiryTimer.current = window.setTimeout(() => {
        console.warn('[AuthContext] Session token expired - logging out.');
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/login');
      }, Math.min(delay, 2147483647));
    };

    restoreAuth();
    return () => clearExpiryTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Arm an expiry timer for the freshly-issued token.
    if (expiryTimer.current) clearExpiryTimer();
    const exp = getTokenExpiry(data.access_token);
    if (exp !== null) {
      const delay = Math.max(0, exp - Date.now());
      expiryTimer.current = window.setTimeout(() => {
        console.warn('[AuthContext] Session token expired - logging out.');
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/login');
      }, Math.min(delay, 2147483647));
    }
  };

  const register = async (registerData: any) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Arm an expiry timer for the freshly-issued token.
    if (expiryTimer.current) clearExpiryTimer();
    const exp = getTokenExpiry(data.access_token);
    if (exp !== null) {
      const delay = Math.max(0, exp - Date.now());
      expiryTimer.current = window.setTimeout(() => {
        console.warn('[AuthContext] Session token expired - logging out.');
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/login');
      }, Math.min(delay, 2147483647));
    }
  };

  const logout = () => {
    clearExpiryTimer();
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
