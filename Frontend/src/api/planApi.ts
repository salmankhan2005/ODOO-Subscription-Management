/**
 * src/api/planApi.ts
 */
import api, { ApiResponse } from './axios';
import type { SubscriptionPlan } from '../types';

type PlanRecord = Record<string, unknown>;

const asRecord = (value: unknown): PlanRecord =>
  value && typeof value === 'object' ? value as PlanRecord : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

export const mapPlan = (value: unknown): SubscriptionPlan => {
  const record = asRecord(value);
  const intervals: SubscriptionPlan['billingInterval'][] = ['daily', 'weekly', 'monthly', 'yearly'];
  const interval = asString(record.billing_interval ?? record.billingInterval);

  return {
    id: asString(record.id),
    name: asString(record.name),
    productId: asString(record.product_id ?? record.productId),
    billingInterval: intervals.includes(interval as SubscriptionPlan['billingInterval'])
      ? interval as SubscriptionPlan['billingInterval']
      : 'monthly',
    intervalCount: asNumber(record.interval_count ?? record.intervalCount) || 1,
    price: asNumber(record.base_price ?? record.price),
    minimumQuantity: asNumber(record.minimum_quantity ?? record.minimumQuantity) || 1,
    startDate: asString(record.start_date ?? record.startDate),
    endDate: asString(record.end_date ?? record.endDate) || undefined,
    autoCloseOnEnd: asBoolean(record.auto_close_on_end ?? record.autoCloseOnEnd, false),
    allowEarlyCancel: asBoolean(record.allow_early_cancel ?? record.allowEarlyCancel, true),
    allowPause: asBoolean(record.allow_pause ?? record.allowPause, true),
    allowRenewal: asBoolean(record.allow_renewal ?? record.allowRenewal, true),
    description: asString(record.description),
    status: record.status === 'archived' ? 'archived' : 'active',
    subscriptionCount: asNumber(record.subscription_count ?? record.subscriptionCount),
  };
};

const toApiPayload = (payload: Partial<SubscriptionPlan>) => ({
  ...(payload.name !== undefined && { name: payload.name }),
  ...(payload.productId !== undefined && { product_id: payload.productId }),
  ...(payload.billingInterval !== undefined && { billing_interval: payload.billingInterval }),
  ...(payload.intervalCount !== undefined && { interval_count: payload.intervalCount }),
  ...(payload.price !== undefined && { base_price: payload.price }),
  ...(payload.minimumQuantity !== undefined && { minimum_quantity: payload.minimumQuantity }),
  ...(payload.startDate !== undefined && { start_date: payload.startDate }),
  ...(payload.endDate !== undefined && { end_date: payload.endDate || null }),
  ...(payload.autoCloseOnEnd !== undefined && { auto_close_on_end: payload.autoCloseOnEnd }),
  ...(payload.allowEarlyCancel !== undefined && { allow_early_cancel: payload.allowEarlyCancel }),
  ...(payload.allowPause !== undefined && { allow_pause: payload.allowPause }),
  ...(payload.allowRenewal !== undefined && { allow_renewal: payload.allowRenewal }),
  ...(payload.description !== undefined && { description: payload.description }),
});

export const planApi = {
  getAll: async (params?: { status?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/plans', { params });
    return { ...data, data: (data.data || []).map(mapPlan) };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/plans/${id}`);
    return { ...data, data: mapPlan(data.data) };
  },

  create: async (payload: Partial<SubscriptionPlan>) => {
    const { data } = await api.post<ApiResponse<unknown>>('/plans', toApiPayload(payload));
    return { ...data, data: mapPlan(data.data) };
  },

  update: async (id: string, payload: Partial<SubscriptionPlan>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/plans/${id}`, toApiPayload(payload));
    return { ...data, data: mapPlan(data.data) };
  },

  setStatus: async (id: string, status: 'active' | 'archived') => {
    const { data } = await api.patch<ApiResponse<unknown>>(`/plans/${id}/status`, { status });
    return { ...data, data: mapPlan(data.data) };
  },

  archive: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/plans/${id}`);
    return data;
  },
};
