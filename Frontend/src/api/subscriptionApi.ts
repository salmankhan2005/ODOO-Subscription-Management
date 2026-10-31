/**
 * src/api/subscriptionApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Subscription } from '../types';

type SubscriptionRecord = Record<string, unknown>;

const asRecord = (value: unknown): SubscriptionRecord =>
  value && typeof value === 'object' ? value as SubscriptionRecord : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapSubscription = (value: unknown): Subscription => {
  const record = asRecord(value);
  const customer = asRecord(record.customers);
  const plan = asRecord(record.subscription_plans);
  const lines = Array.isArray(record.subscription_lines) ? record.subscription_lines : [];
  const statuses: Subscription['status'][] = [
    'draft', 'quotation', 'confirmed', 'active', 'paused', 'closed', 'cancelled', 'expired',
  ];
  const intervals: Subscription['billingInterval'][] = ['daily', 'weekly', 'monthly', 'yearly'];
  const status = asString(record.status);
  const interval = asString(record.billing_interval);

  return {
    id: asString(record.id),
    subscriptionNumber: asString(record.subscription_number ?? record.subscriptionNumber),
    customerId: asString(record.customer_id ?? record.customerId),
    customerName: asString(customer.name ?? record.customerName),
    customerEmail: asString(customer.email ?? record.customerEmail),
    planId: asString(record.plan_id ?? record.planId),
    planName: asString(plan.name ?? record.planName),
    billingInterval: intervals.includes(interval as Subscription['billingInterval'])
      ? interval as Subscription['billingInterval']
      : 'monthly',
    status: statuses.includes(status as Subscription['status'])
      ? status as Subscription['status']
      : 'draft',
    startDate: asString(record.start_date ?? record.startDate),
    nextBillingDate: asString(record.next_billing_date ?? record.nextBillingDate),
    expiryDate: asString(record.expiry_date ?? record.expiryDate) || undefined,
    paymentTerms: asString(record.payment_terms ?? record.paymentTerms),
    lines: lines.map((value) => {
      const line = asRecord(value);
      return {
        id: asString(line.id),
        productId: asString(line.product_id),
        productName: asString(line.description),
        variantId: asString(line.variant_id) || undefined,
        quantity: asNumber(line.quantity),
        unitPrice: asNumber(line.unit_price),
        taxRate: asNumber(line.tax_rate),
        taxAmount: asNumber(line.tax_amount),
        discountAmount: asNumber(line.discount_amount),
        subtotal: asNumber(line.subtotal),
        total: asNumber(line.line_total),
      };
    }),
    totalAmount: asNumber(record.total_amount ?? record.totalAmount),
    autoRenew: Boolean(record.auto_renew ?? record.autoRenew),
    pauseReason: asString(record.pause_reason ?? record.pauseReason) || undefined,
    notes: asString(record.notes) || undefined,
    createdAt: asString(record.created_at ?? record.createdAt),
  };
};

export const subscriptionApi = {
  getAll: async (params?: { status?: string; customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/subscriptions', { params });
    return { ...data, data: (data.data || []).map(mapSubscription) };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/subscriptions/${id}`);
    return { ...data, data: mapSubscription(data.data) };
  },

  create: async (payload: {
    customer_id: string;
    plan_id: string;
    quantity: number;
    start_date: string;
    expiry_date?: string | null;
    payment_terms?: string;
    auto_renew?: boolean;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiResponse<unknown>>('/subscriptions', payload);
    return { ...data, data: mapSubscription(data.data) };
  },

  update: async (id: string, payload: {
    payment_terms?: string;
    auto_renew?: boolean;
    notes?: string;
    currency?: string;
    expiry_date?: string | null;
  }) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/subscriptions/${id}`, payload);
    return { ...data, data: mapSubscription(data.data) };
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{
      id: string;
      deleted?: boolean;
      status?: Subscription['status'];
    }>>(`/subscriptions/${id}`);
    return data;
  },

  confirm: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/confirm`);
    return data;
  },

  activate: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/activate`);
    return data;
  },

  pause: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/pause`, { reason });
    return data;
  },

  resume: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/resume`);
    return data;
  },

  updateStatus: async (id: string, status: Subscription['status'], reason = '') => {
    switch (status) {
      case 'confirmed':
        return subscriptionApi.confirm(id);
      case 'active':
        return subscriptionApi.resume(id);
      case 'paused':
        return subscriptionApi.pause(id, reason);
      case 'cancelled':
        return subscriptionApi.cancel(id, reason);
      case 'closed':
        return subscriptionApi.close(id);
      default:
        throw new Error(`Unsupported subscription status transition: ${status}`);
    }
  },

  cancel: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/cancel`, { reason });
    return data;
  },

  close: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/close`);
    return data;
  },

  renew: async (id: string) => {
    const { data } = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/renew`);
    return data;
  },

  getHistory: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/subscriptions/${id}/history`);
    return data;
  },
};
