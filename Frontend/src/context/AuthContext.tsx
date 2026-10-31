import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  appMode: 'showcase' | 'workspace';
  setAppMode: (mode: 'showcase' | 'workspace') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('admin');
  const [user, setUser] = useState<User | null>(INITIAL_USERS[0]);
  const [appMode, setAppMode] = useState<'showcase' | 'workspace'>('showcase');

  useEffect(() => {
    const matched = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setUser(matched);
  }, [role]);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    const matched = INITIAL_USERS.find((u) => u.role === newRole) || INITIAL_USERS[0];
    setUser(matched);
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    if (!email || !pass) {
      return { success: false, message: 'Please provide both email and password' };
    }
    const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser(matched);
      setRole(matched.role);
      setAppMode('workspace');
      return { success: true };
    }
    // Default fallback mock login
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'staff',
      company: 'Brightloop Team'
    };
    setUser(newUser);
    setRole('staff');
    setAppMode('workspace');
    return { success: true };
  };

  const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    // Password requirements: >8 chars, uppercase, lowercase, special character
    const hasLength = pass.length > 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (!hasLength || !hasUpper || !hasLower || !hasSpecial) {
      return {
        success: false,
        message: 'Password must be >8 characters with an uppercase letter, lowercase letter, and special character.'
      };
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'customer',
      customerId: 'cust_1',
      company: `${name} Software LLC`
    };
    setUser(newUser);
    setRole('customer');
    setAppMode('workspace');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setAppMode('showcase');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        appMode,
        setAppMode
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
