import { storage } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = await storage.getApiUrl();
  const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // If not FormData, add Content-Type: application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  const accessToken = await storage.getAccessToken();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized / Token Expired
    if (response.status === 401) {
      const errorJson = await response.clone().json().catch(() => null);

      if (errorJson?.error?.code === 'TOKEN_EXPIRED') {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = await storage.getRefreshToken();

          if (!refreshToken) {
            isRefreshing = false;
            await storage.clearTokens();
            onUnauthorizedCallback?.();
            throw new Error('Session expired. Please log in again.');
          }

          try {
            const refreshRes = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            const refreshData = await refreshRes.json();
            if (refreshRes.ok && refreshData.success) {
              const newTokens = refreshData.data.tokens;
              await storage.setTokens(newTokens.accessToken, newTokens.refreshToken);
              isRefreshing = false;
              onRefreshed(newTokens.accessToken);

              // Retry original request with new token
              headers.Authorization = `Bearer ${newTokens.accessToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              const retryJson = await retryRes.json();
              if (!retryRes.ok || !retryJson.success) {
                throw new Error(retryJson.error?.message || 'Request failed after refresh');
              }
              return retryJson.data as T;
            } else {
              isRefreshing = false;
              await storage.clearTokens();
              onUnauthorizedCallback?.();
              throw new Error('Session expired. Please log in again.');
            }
          } catch (refreshErr) {
            isRefreshing = false;
            await storage.clearTokens();
            onUnauthorizedCallback?.();
            throw refreshErr;
          }
        } else {
          // Wait for concurrent refresh to complete
          return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh(async (newToken) => {
              try {
                headers.Authorization = `Bearer ${newToken}`;
                const retryRes = await fetch(url, { ...options, headers });
                const retryJson = await retryRes.json();
                if (!retryRes.ok || !retryJson.success) {
                  return reject(new Error(retryJson.error?.message || 'Request failed'));
                }
                resolve(retryJson.data as T);
              } catch (e) {
                reject(e);
              }
            });
          });
        }
      } else {
        // Not a token expiry error, but unauthorized
        await storage.clearTokens();
        onUnauthorizedCallback?.();
        throw new Error(errorJson?.error?.message || 'Authentication required');
      }
    }

    const json = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json?.error?.message || `HTTP ${response.status}: Request failed`;
      const err: any = new Error(errorMsg);
      err.code = json?.error?.code;
      err.details = json?.error?.details;
      throw err;
    }

    return json.data as T;
  } catch (error: any) {
    if (error.message === 'Network request failed') {
      throw new Error('Unable to connect to InStock server. Check network or server status.');
    }
    throw error;
  }
}
