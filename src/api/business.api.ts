import { apiClient } from './client';
import { BusinessProfile } from './auth.api';

export const businessApi = {
  getProfile: () =>
    apiClient<BusinessProfile>('business'),

  updateProfile: (data: Partial<BusinessProfile>) =>
    apiClient<BusinessProfile>('business', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
