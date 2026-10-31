/**
 * src/api/discountApi.ts
 */
import api, { ApiResponse } from './axios';
import type { DiscountRule } from '../types';

export const discountApi = {
  getAll: async (params?: { status?: string }) => {
    const { data } = await api.get<ApiResponse<DiscountRule[]>>('/discounts', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<DiscountRule>>(`/discounts/${id}`);
    return data;
  },

  create: async (payload: Partial<DiscountRule>) => {
    const { data } = await api.post<ApiResponse<DiscountRule>>('/discounts', payload);
    return data;
  },

  update: async (id: string, payload: Partial<DiscountRule>) => {
    const { data } = await api.put<ApiResponse<DiscountRule>>(`/discounts/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/discounts/${id}`);
    return data;
  },

  validate: async (code: string, productIds: string[], amount: number, quantity: number) => {
    const { data } = await api.post<ApiResponse<any>>('/discounts/validate', {
      code,
      product_ids: productIds,
      amount,
      quantity,
    });
    return data;
  },

  getUsage: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/discounts/${id}/usage`);
    return data;
  },
};
