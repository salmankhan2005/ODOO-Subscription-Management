/**
 * src/api/paymentApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Payment } from '../types';

export const paymentApi = {
  getAll: async (params?: { customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<Payment[]>>('/payments', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return data;
  },

  record: async (payload: {
    invoice_id: string;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
    payment_date?: string;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiResponse<Payment>>('/payments', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Payment>) => {
    const { data } = await api.put<ApiResponse<Payment>>(`/payments/${id}`, payload);
    return data;
  },

  refund: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<Payment>>(`/payments/${id}/refund`, { reason });
    return data;
  },

  getAllocations: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/payments/${id}/allocations`);
    return data;
  },
};
