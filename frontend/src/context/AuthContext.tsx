import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api.client';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phoneNumber: string) => Promise<{
    message: string;
    expiresInSeconds: number;
    mockNotice?: string;
    devOtp?: string;
  }>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'miniledger_jwt_token';
const USER_KEY = 'miniledger_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getItem(TOKEN_KEY);
        const storedUser = await storage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          api.setToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const sendOtp = async (phoneNumber: string) => {
    const res = await api.post<{ success: boolean; data: any }>('/api/auth/send-otp', {
      phoneNumber,
    });
    return res.data;
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    const res = await api.post<{
      success: boolean;
      data: { token: string; user: User };
    }>('/api/auth/verify-otp', { phoneNumber, otp });

    const { token: newToken, user: newUser } = res.data;

    // Save in storage
    await storage.setItem(TOKEN_KEY, newToken);
    await storage.setItem(USER_KEY, JSON.stringify(newUser));

    // Update in-memory state
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
