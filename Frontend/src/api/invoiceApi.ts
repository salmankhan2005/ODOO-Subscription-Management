/**
 * src/api/invoiceApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Invoice } from '../types';

export const invoiceApi = {
  getAll: async (params?: { status?: string; customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data;
  },

  generate: async (subscriptionId: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>('/invoices/generate', {
      subscription_id: subscriptionId,
    });
    return data;
  },

  confirm: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/confirm`);
    return data;
  },

  send: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/send`);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/cancel`);
    return data;
  },

  update: async (id: string, payload: Partial<Invoice>) => {
    const { data } = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload);
    return data;
  },

  downloadPdf: async (id: string) => {
    const { data } = await api.get<Blob>(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  getPayments: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/invoices/${id}/payments`);
    return data;
  },

  getOverdue: async (params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices/overdue', { params });
    return data;
  },
};
