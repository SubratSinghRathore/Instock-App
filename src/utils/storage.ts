import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@instock_access_token';
const REFRESH_TOKEN_KEY = '@instock_refresh_token';
const USER_KEY = '@instock_user';
const API_URL_KEY = '@instock_api_url';

// Default to 10.0.2.2 for Android Emulator, or 127.0.0.1 for adb reverse
export const DEFAULT_API_URL = 'https://instock-production-7101.up.railway.app/api/v1';

export const storage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  },

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser<T>(user: T): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getApiUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(API_URL_KEY);
      return url || DEFAULT_API_URL;
    } catch {
      return DEFAULT_API_URL;
    }
  },

  async setApiUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(API_URL_KEY, url);
  },
};
