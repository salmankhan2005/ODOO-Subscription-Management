/**
 * src/api/billingApi.ts
 */
import api, { ApiResponse } from './axios';
import type { BillingRun } from '../types';

export const billingApi = {
  runBilling: async (billingSecret?: string) => {
    const headers: Record<string, string> = {};
    if (billingSecret) headers['X-Billing-Secret'] = billingSecret;
    const { data } = await api.post<ApiResponse<BillingRun>>('/billing/run', {}, { headers });
    return data;
  },

  getRuns: async (params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<BillingRun[]>>('/billing/runs', { params });
    return data;
  },

  getRun: async (id: string) => {
    const { data } = await api.get<ApiResponse<BillingRun>>(`/billing/runs/${id}`);
    return data;
  },

  getDueSubscriptions: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/billing/due-subscriptions');
    return data;
  },

  preview: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/billing/preview');
    return data;
  },

  retryItem: async (runItemId: string) => {
    const { data } = await api.post<ApiResponse<any>>(`/billing/retry/${runItemId}`);
    return data;
  },
};
