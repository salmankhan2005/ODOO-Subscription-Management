/**
 * src/api/authApi.ts — Authentication API calls
 */
import api, { ApiResponse, StoredAuthAccount, tokenStorage } from './axios';

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role: StoredAuthAccount['role'];
    full_name: string;
    customer_id: string | null;
  };
}

export const authApi = {
  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
  }) => {
    const { data } = await api.post<ApiResponse<any>>('/auth/register', payload);
    return data;
  },

  login: async (
    email: string,
    password: string,
    expectedRole?: StoredAuthAccount['role']
  ) => {
    const { data } = await api.post<ApiResponse<LoginResult>>('/auth/login', {
      email,
      password,
    });
    if (
      data.success &&
      expectedRole &&
      data.data?.user.role !== expectedRole
    ) {
      return {
        ...data,
        success: false,
        message: `This account is registered as ${data.data?.user.role || 'another role'}. Sign in from the matching portal.`,
      };
    }
    if (
      data.success &&
      data.data &&
      ['admin', 'staff', 'customer'].includes(data.data.user.role)
    ) {
      tokenStorage.saveAccount(
        {
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.full_name,
          role: data.data.user.role,
        },
        data.data.access_token,
        data.data.refresh_token
      );
    }
    return data;
  },

  logout: async () => {
    const accessToken = tokenStorage.getToken();
    const refreshToken = tokenStorage.getRefresh();
    const request = accessToken && refreshToken
      ? api.post(
          '/auth/logout',
          { refresh_token: refreshToken },
          { headers: { Authorization: ['Bearer', accessToken].join(' ') } }
        )
      : Promise.resolve();
    tokenStorage.clear();
    await request;
  },

  me: async () => {
    const { data } = await api.get<ApiResponse<any>>('/auth/me');
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', {
      email,
      redirect_url: `${window.location.origin}/reset-password`,
    });
    return data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post<ApiResponse<any>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return data;
  },

  isLoggedIn: () => !!tokenStorage.getToken() && !!tokenStorage.getRefresh(),
  clearSession: () => tokenStorage.clear(),
};
