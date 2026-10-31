/**
 * src/api/subscriptionApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Subscription } from '../types';

export const subscriptionApi = {
  getAll: async (params?: { status?: string; customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<Subscription[]>>('/subscriptions', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
    return data;
  },

  create: async (payload: any) => {
    const { data } = await api.post<ApiResponse<Subscription>>('/subscriptions', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Subscription>) => {
    const { data } = await api.put<ApiResponse<Subscription>>(`/subscriptions/${id}`, payload);
    return data;
  },

  confirm: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/confirm`);
    return data;
  },

  activate: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/activate`);
    return data;
  },

  pause: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/pause`, { reason });
    return data;
  },

  resume: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/resume`);
    return data;
  },

  cancel: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/cancel`, { reason });
    return data;
  },

  close: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/close`);
    return data;
  },

  renew: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/renew`);
    return data;
  },

  getHistory: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/subscriptions/${id}/history`);
    return data;
  },
};
