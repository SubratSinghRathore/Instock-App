import { apiClient } from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  businessId: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  currency: string;
  lowStockAlertThreshold?: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface AuthResponse {
  user: UserProfile;
  business: BusinessProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: {
    businessName: string;
    name: string;
    email: string;
    password: string;
    currency?: string;
  }) =>
    apiClient<AuthResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    apiClient<{ user: UserProfile; business: BusinessProfile }>('auth/me'),

  logout: (refreshToken: string) =>
    apiClient<{ message: string }>('auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
