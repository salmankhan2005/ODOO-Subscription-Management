import api, { ApiResponse } from './axios';
import { UserRole } from '../types';

export interface CreateStaffPayload {
  full_name: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'admin' | 'staff'>;
}

export interface CreatedStaffAccount {
  user_id: string;
  full_name: string;
  email: string;
  role: Extract<UserRole, 'admin' | 'staff'>;
}

export const staffApi = {
  create: async (payload: CreateStaffPayload) => {
    const { data } = await api.post<ApiResponse<CreatedStaffAccount>>('/staff', payload);
    return data;
  },
};
