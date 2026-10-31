/**
 * src/api/billingApi.ts
 */
import api, { ApiResponse } from './axios';
import type { BillingRun } from '../types';
import { mapSubscription } from './subscriptionApi';

type BillingRunRecord = Record<string, unknown>;

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapBillingRun = (value: unknown): BillingRun => {
  const record = value && typeof value === 'object' ? value as BillingRunRecord : {};
  const statuses: BillingRun['status'][] = ['in_progress', 'completed', 'failed', 'partially_failed'];
  const status = typeof record.status === 'string' ? record.status : '';

  return {
    id: typeof record.id === 'string' ? record.id : '',
    startedAt: typeof (record.started_at ?? record.startedAt) === 'string'
      ? String(record.started_at ?? record.startedAt)
      : '',
    completedAt: typeof (record.completed_at ?? record.completedAt) === 'string'
      ? String(record.completed_at ?? record.completedAt)
      : undefined,
    totalProcessed: asNumber(record.total_processed ?? record.totalProcessed),
    successful: asNumber(record.successful),
    failed: asNumber(record.failed),
    status: statuses.includes(status as BillingRun['status'])
      ? status as BillingRun['status']
      : 'failed',
    generatedInvoiceIds: [],
    totalBilledAmount: asNumber(record.total_billed_amount ?? record.totalBilledAmount),
  };
};

export const billingApi = {
  runBilling: async (billingSecret?: string) => {
    const headers: Record<string, string> = {};
    if (billingSecret) headers['X-Billing-Secret'] = billingSecret;
    const { data } = await api.post<ApiResponse<BillingRun>>('/billing/run', {}, { headers });
    return data;
  },

  getRuns: async (params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/billing/runs', { params });
    return { ...data, data: (data.data || []).map(mapBillingRun) };
  },

  getRun: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/billing/runs/${id}`);
    return { ...data, data: mapBillingRun(data.data) };
  },

  getDueSubscriptions: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/billing/due-subscriptions');
    return { ...data, data: (data.data || []).map(mapSubscription) };
  },

  preview: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/billing/preview');
    return { ...data, data: (data.data || []).map(mapSubscription) };
  },

  retryItem: async (runItemId: string) => {
    const { data } = await api.post<ApiResponse<any>>(`/billing/retry/${runItemId}`);
    return data;
  },
};
