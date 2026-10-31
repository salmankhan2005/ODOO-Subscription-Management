/**
 * src/api/taxApi.ts
 */
import api, { ApiResponse } from './axios';
import type { TaxRule } from '../types';

export const taxApi = {
  getAll: async (params?: { status?: string }) => {
    const { data } = await api.get<ApiResponse<TaxRule[]>>('/taxes', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<TaxRule>>(`/taxes/${id}`);
    return data;
  },

  create: async (payload: Partial<TaxRule>) => {
    const { data } = await api.post<ApiResponse<TaxRule>>('/taxes', payload);
    return data;
  },

  update: async (id: string, payload: Partial<TaxRule>) => {
    const { data } = await api.put<ApiResponse<TaxRule>>(`/taxes/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/taxes/${id}`);
    return data;
  },

  calculate: async (productId: string, amount: number) => {
    const { data } = await api.post<ApiResponse<any>>('/taxes/calculate', {
      product_id: productId,
      amount,
    });
    return data;
  },
};
