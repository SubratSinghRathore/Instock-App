import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authApi, UserProfile, BusinessProfile } from '../api/auth.api';
import { setOnUnauthorized } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  business: BusinessProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (businessName: string, name: string, email: string, pass: string, currency?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateBusinessState: (updated: BusinessProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      await storage.clearTokens();
      setUser(null);
      setBusiness(null);
    }
  };

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });

    const initAuth = async () => {
      try {
        const token = await storage.getAccessToken();
        if (token) {
          const res = await authApi.getMe();
          setUser(res.user);
          setBusiness(res.business);
        }
      } catch {
        await storage.clearTokens();
        setUser(null);
        setBusiness(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    await storage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    setBusiness(res.business);
  };

  const register = async (
    businessName: string,
    name: string,
    email: string,
    pass: string,
    currency?: string
  ) => {
    const res = await authApi.register({
      businessName,
      name,
      email,
      password: pass,
      currency,
    });
    await storage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    setBusiness(res.business);
  };

  const refreshProfile = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      setBusiness(res.business);
    } catch {
      // Ignored
    }
  };

  const updateBusinessState = (updated: BusinessProfile) => {
    setBusiness(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updateBusinessState,
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
