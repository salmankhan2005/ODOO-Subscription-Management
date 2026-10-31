/**
 * src/api/quotationApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Quotation, Subscription } from '../types';

export const quotationApi = {
  getAll: async (params?: { status?: string; customer_id?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<Quotation[]>>('/quotations', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Quotation>>(`/quotations/${id}`);
    return data;
  },

  create: async (payload: any) => {
    const { data } = await api.post<ApiResponse<Quotation>>('/quotations', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Quotation>) => {
    const { data } = await api.put<ApiResponse<Quotation>>(`/quotations/${id}`, payload);
    return data;
  },

  confirm: async (id: string) => {
    const { data } = await api.post<ApiResponse<Quotation>>(`/quotations/${id}/confirm`);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.post<ApiResponse<Quotation>>(`/quotations/${id}/cancel`);
    return data;
  },

  convertToSubscription: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/quotations/${id}/convert-to-subscription`);
    return data;
  },

  // Templates
  getTemplates: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/quotation-templates');
    return data;
  },

  createTemplate: async (payload: any) => {
    const { data } = await api.post<ApiResponse<any>>('/quotation-templates', payload);
    return data;
  },

  getTemplate: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/quotation-templates/${id}`);
    return data;
  },

  updateTemplate: async (id: string, payload: any) => {
    const { data } = await api.put<ApiResponse<any>>(`/quotation-templates/${id}`, payload);
    return data;
  },

  deleteTemplate: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/quotation-templates/${id}`);
    return data;
  },
};
