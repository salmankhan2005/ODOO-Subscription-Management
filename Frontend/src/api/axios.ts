/**
 * src/api/axios.ts
 * Centralised Axios instance that:
 *  - Reads the base URL from VITE_API_BASE_URL
 *  - Attaches the JWT access token from the current tab's sessionStorage
 *  - Handles 401 responses by clearing the session and redirecting to login
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// ── Token management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'brightloop_access_token';
const REFRESH_KEY = 'brightloop_refresh_token';
const ACCOUNTS_KEY = 'brightloop_accounts';
const ACTIVE_ACCOUNT_KEY = 'brightloop_active_account';
export interface StoredAuthAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  access_token: string;
  refresh_token: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _authAccountId?: string;
};

const readAccounts = (): StoredAuthAccount[] => {
  try {
    const stored = sessionStorage.getItem(ACCOUNTS_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((account): account is StoredAuthAccount =>
      !!account &&
      typeof account === 'object' &&
      typeof account.id === 'string' &&
      typeof account.email === 'string' &&
      typeof account.name === 'string' &&
      ['admin', 'staff', 'customer'].includes(account.role) &&
      typeof account.access_token === 'string' &&
      typeof account.refresh_token === 'string'
    );
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: StoredAuthAccount[]) => {
  sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const activeAccount = () =>
  readAccounts().find((account) => account.id === sessionStorage.getItem(ACTIVE_ACCOUNT_KEY));

export const tokenStorage = {
  getAccounts: readAccounts,
  getActiveAccountId: () => activeAccount()?.id,
  getToken: () => activeAccount()?.access_token || sessionStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => {
    const account = activeAccount();
    if (account) {
      writeAccounts(readAccounts().map((item) =>
        item.id === account.id ? { ...item, access_token: token } : item
      ));
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },
  getRefresh: () => activeAccount()?.refresh_token || sessionStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => {
    const account = activeAccount();
    if (account) {
      writeAccounts(readAccounts().map((item) =>
        item.id === account.id ? { ...item, refresh_token: token } : item
      ));
    } else {
      sessionStorage.setItem(REFRESH_KEY, token);
    }
  },
  saveAccount: (
    user: { id: string; email: string; name: string; role: StoredAuthAccount['role'] },
    accessToken: string,
    refreshToken: string
  ) => {
    const accounts = readAccounts().filter((account) => account.id !== user.id);
    accounts.push({
      ...user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    writeAccounts(accounts);
    sessionStorage.setItem(ACTIVE_ACCOUNT_KEY, user.id);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
  activate: (accountId: string) => {
    if (!readAccounts().some((account) => account.id === accountId)) return false;
    sessionStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    return true;
  },
  getAccountForAccessToken: (token: string) =>
    readAccounts().find((account) => account.access_token === token),
  updateAccountTokens: (accountId: string, accessToken: string, refreshToken: string) => {
    writeAccounts(readAccounts().map((account) =>
      account.id === accountId
        ? { ...account, access_token: accessToken, refresh_token: refreshToken }
        : account
    ));
  },
  removeAccount: (accountId: string) => {
    const accounts = readAccounts().filter((account) => account.id !== accountId);
    writeAccounts(accounts);
    if (sessionStorage.getItem(ACTIVE_ACCOUNT_KEY) === accountId) {
      if (accounts.length > 0) {
        sessionStorage.setItem(ACTIVE_ACCOUNT_KEY, accounts[0].id);
      } else {
        sessionStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      }
    }
  },
  clear: () => {
    const account = activeAccount();
    if (account) tokenStorage.removeAccount(account.id);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

// ── Axios instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
const refreshPromises = new Map<string, Promise<string>>();

const tokenExpiresSoon = (token: string) => {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return false;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return false;
  }
};

const refreshSession = (refreshToken: string, account?: StoredAuthAccount) => {
  const refreshKey = account?.id || 'legacy';
  let refreshPromise = refreshPromises.get(refreshKey);
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then(({ data }): string => {
        const nextAccessToken = data?.data?.access_token;
        const nextRefreshToken = data?.data?.refresh_token;
        if (typeof nextAccessToken !== 'string' || typeof nextRefreshToken !== 'string') {
          throw new Error('The server returned an invalid refreshed session');
        }
        if (account) {
          tokenStorage.updateAccountTokens(account.id, nextAccessToken, nextRefreshToken);
        } else {
          tokenStorage.setToken(nextAccessToken);
          tokenStorage.setRefresh(nextRefreshToken);
        }
        return nextAccessToken;
      })
      .finally(() => {
        refreshPromises.delete(refreshKey);
      });
    refreshPromises.set(refreshKey, refreshPromise);
  }
  return refreshPromise;
};

const clearFailedSession = (account?: StoredAuthAccount) => {
  if (account) {
    const failedAccountWasActive = tokenStorage.getActiveAccountId() === account.id;
    tokenStorage.removeAccount(account.id);
    if (failedAccountWasActive) window.location.href = '/';
  } else {
    tokenStorage.clear();
    window.location.href = '/';
  }
};

// Request interceptor — attach Bearer token
api.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    let token = tokenStorage.getToken();
    const accountId = tokenStorage.getActiveAccountId();
    const account = accountId
      ? tokenStorage.getAccounts().find((item) => item.id === accountId)
      : undefined;
    const refreshToken = account?.refresh_token || tokenStorage.getRefresh();
    if (token && refreshToken && tokenExpiresSoon(token)) {
      try {
        token = await refreshSession(refreshToken, account);
      } catch (error) {
        clearFailedSession(account);
        throw error;
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      (config as RetryableRequestConfig)._authAccountId = accountId;
    }
  }
  return config;
});

// Response interceptor — handle 401 / token refresh
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const isAuthRequest = /\/auth\/(?:login|refresh|logout)(?:\?|$)/.test(original?.url || '');
    if (error.response?.status === 401 && original && !isAuthRequest && !original._retry) {
      original._retry = true;
      const requestToken = original.headers?.Authorization?.toString().replace(/^Bearer\s+/i, '');
      const account = original._authAccountId
        ? tokenStorage.getAccounts().find((item) => item.id === original._authAccountId)
        : requestToken
        ? tokenStorage.getAccountForAccessToken(requestToken)
        : undefined;
      if (account && requestToken && account.access_token !== requestToken) {
        original.headers.Authorization = `Bearer ${account.access_token}`;
        return api(original);
      }

      const refreshToken = account?.refresh_token ||
        (original._authAccountId ? undefined : tokenStorage.getRefresh());
      if (refreshToken) {
        try {
          const nextAccessToken = await refreshSession(refreshToken, account);
          original.headers.Authorization = `Bearer ${nextAccessToken}`;
          return api(original);
        } catch {
          clearFailedSession(account);
        }
      } else {
        clearFailedSession(account);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Response type ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
}
