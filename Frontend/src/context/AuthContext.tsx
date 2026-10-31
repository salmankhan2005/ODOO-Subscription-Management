import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/authApi';
import { tokenStorage } from '../api/axios';

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  accounts: AuthAccount[];
  login: (email: string, pass: string, expectedRole?: UserRole) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, pass: string, extra?: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
  switchAccount: (accountId: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUserRole = (role: unknown): role is UserRole =>
  role === 'admin' || role === 'staff' || role === 'customer';

const mapApiUser = (value: unknown): User | null => {
  if (!value || typeof value !== 'object') return null;

  const apiUser = value as Record<string, unknown>;
  const { id, email, role } = apiUser;
  if (
    typeof id !== 'string' ||
    typeof email !== 'string' ||
    !isUserRole(role)
  ) {
    return null;
  }

  const name =
    (typeof apiUser.full_name === 'string' && apiUser.full_name) ||
    (typeof apiUser.name === 'string' && apiUser.name) ||
    email.split('@')[0];

  return {
    id,
    name,
    email,
    role,
    customerId: typeof apiUser.customer_id === 'string' ? apiUser.customer_id : undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verify a tab's stored session with the backend before showing its portal.
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        if (!authApi.isLoggedIn()) {
          authApi.clearSession();
          return;
        }
        const response = await authApi.me();
        const restoredUser = response.success ? mapApiUser(response.data) : null;
        if (restoredUser) {
          if (active) {
            setUser(restoredUser);
            setRole(restoredUser.role);
            tokenStorage.saveAccount(
              restoredUser,
              tokenStorage.getToken() || '',
              tokenStorage.getRefresh() || ''
            );
          }
        } else {
          authApi.clearSession();
        }
      } catch {
        authApi.clearSession();
      } finally {
        if (active) {
          setAccounts(tokenStorage.getAccounts().map(({ id, email, name, role }) => ({
            id, email, name, role,
          })));
          setIsLoading(false);
        }
      }
    };
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    pass: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; message?: string }> => {
    if (!email || !pass) {
      return { success: false, message: 'Please provide both email and password' };
    }
    try {
      const result = await authApi.login(email, pass, expectedRole);
      if (result.success && result.data) {
        const authenticatedUser = mapApiUser(result.data.user);
        if (!authenticatedUser) {
          authApi.clearSession();
          return { success: false, message: 'Your account role is not valid. Contact an administrator.' };
        }
        setUser(authenticatedUser);
        setRole(authenticatedUser.role);
        setAccounts(tokenStorage.getAccounts().map(({ id, email, name, role }) => ({
          id, email, name, role,
        })));
        return { success: true };
      }
      return { success: false, message: result.message || 'Login failed' };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    extra?: Record<string, string>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await authApi.register({
        full_name: name,
        email,
        password: pass,
        phone: extra?.phone,
        company_name: extra?.company_name,
      });
      if (result.success) {
        // Auto-login after registration
        return await login(email, pass, 'customer');
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      return { success: false, message: msg };
    }
  };

  const switchAccount = useCallback(async (accountId: string) => {
    const previousAccountId = tokenStorage.getActiveAccountId();
    if (!tokenStorage.activate(accountId)) {
      return { success: false, message: 'That account is no longer available in this tab.' };
    }

    try {
      const response = await authApi.me();
      const switchedUser = response.success ? mapApiUser(response.data) : null;
      if (!switchedUser || switchedUser.id !== accountId) {
        throw new Error('The saved session could not be verified.');
      }
      setUser(switchedUser);
      setRole(switchedUser.role);
      setAccounts(tokenStorage.getAccounts().map(({ id, email, name, role }) => ({
        id, email, name, role,
      })));
      return { success: true };
    } catch (error) {
      tokenStorage.removeAccount(accountId);
      if (previousAccountId) tokenStorage.activate(previousAccountId);
      setAccounts(tokenStorage.getAccounts().map(({ id, email, name, role }) => ({
        id, email, name, role,
      })));
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to switch accounts.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setRole('customer');
    let logoutError: unknown;
    try {
      await authApi.logout();
    } catch (error) {
      logoutError = error;
    }

    const remainingAccounts = tokenStorage.getAccounts();
    setAccounts(remainingAccounts.map(({ id, email, name, role }) => ({
      id, email, name, role,
    })));
    if (remainingAccounts[0]) {
      const switched = await switchAccount(remainingAccounts[0].id);
      if (!switched.success) setUser(null);
    }
    if (logoutError) throw logoutError;
  }, [switchAccount]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        accounts,
        login,
        register,
        switchAccount,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
