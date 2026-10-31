/**
 * src/api/planApi.ts
 */
import api, { ApiResponse } from './axios';
import type { SubscriptionPlan } from '../types';

export const planApi = {
  getAll: async (params?: { status?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<SubscriptionPlan[]>>('/plans', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<SubscriptionPlan>>(`/plans/${id}`);
    return data;
  },

  create: async (payload: Partial<SubscriptionPlan>) => {
    const { data } = await api.post<ApiResponse<SubscriptionPlan>>('/plans', payload);
    return data;
  },

  update: async (id: string, payload: Partial<SubscriptionPlan>) => {
    const { data } = await api.put<ApiResponse<SubscriptionPlan>>(`/plans/${id}`, payload);
    return data;
  },

  setStatus: async (id: string, status: 'active' | 'archived') => {
    const { data } = await api.patch<ApiResponse<SubscriptionPlan>>(`/plans/${id}/status`, { status });
    return data;
  },

  archive: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/plans/${id}`);
    return data;
  },
};
