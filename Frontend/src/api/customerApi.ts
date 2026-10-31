/**
 * src/api/customerApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Customer } from '../types';

export const customerApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data;
  },

  create: async (payload: Partial<Customer>) => {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Customer>) => {
    const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data;
  },

  deactivate: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/customers/${id}`);
    return data;
  },

  getSubscriptions: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/subscriptions`, { params });
    return data;
  },

  getInvoices: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/invoices`, { params });
    return data;
  },

  getPayments: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/payments`, { params });
    return data;
  },

  getBalance: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/customers/${id}/balance`);
    return data;
  },
};
