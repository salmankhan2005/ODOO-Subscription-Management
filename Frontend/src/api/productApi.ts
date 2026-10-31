/**
 * src/api/productApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Product, ProductVariant } from '../types';

export const productApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<Product[]>>('/products', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
  },

  create: async (payload: Partial<Product>) => {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Product>) => {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data;
  },

  archive: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return data;
  },

  getVariants: async (productId: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`);
    return data;
  },

  addVariant: async (productId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, payload);
    return data;
  },

  updateVariant: async (variantId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.put<ApiResponse<ProductVariant>>(`/variants/${variantId}`, payload);
    return data;
  },

  deleteVariant: async (variantId: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/variants/${variantId}`);
    return data;
  },
};
