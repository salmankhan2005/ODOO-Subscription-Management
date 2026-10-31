/**
 * src/api/customerApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Customer } from '../types';

type CustomerRecord = Partial<Customer> & Record<string, unknown>;

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapCustomer = (record: CustomerRecord): Customer => ({
  id: String(record.id ?? ''),
  name: String(record.name ?? ''),
  email: String(record.email ?? ''),
  phone: String(record.phone ?? ''),
  company: String(record.company ?? record.company_name ?? ''),
  billingAddress: String(record.billingAddress ?? record.billing_address ?? ''),
  country: String(record.country ?? ''),
  taxId: String(record.taxId ?? record.tax_id ?? ''),
  status: record.status === 'inactive' ? 'inactive' : 'active',
  activeSubscriptionsCount: toNumber(
    record.activeSubscriptionsCount ?? record.active_subscriptions_count
  ),
  outstandingBalance: toNumber(record.outstandingBalance ?? record.outstanding_balance),
  totalRevenue: toNumber(record.totalRevenue ?? record.total_revenue),
  createdAt: String(record.createdAt ?? record.created_at ?? ''),
});

const toApiPayload = (payload: Partial<Customer>) => ({
  name: payload.name,
  email: payload.email,
  phone: payload.phone,
  company_name: payload.company,
  billing_address: payload.billingAddress,
  country: payload.country,
  tax_id: payload.taxId,
  status: payload.status,
});

export const customerApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<CustomerRecord[]>>('/customers', { params });
    return { ...data, data: (data.data || []).map(mapCustomer) };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<CustomerRecord>>(`/customers/${id}`);
    return { ...data, data: mapCustomer(data.data || {}) };
  },

  create: async (payload: Partial<Customer>) => {
    const { data } = await api.post<ApiResponse<CustomerRecord>>('/customers', toApiPayload(payload));
    return { ...data, data: mapCustomer(data.data || {}) };
  },

  update: async (id: string, payload: Partial<Customer>) => {
    const { data } = await api.put<ApiResponse<CustomerRecord>>(`/customers/${id}`, toApiPayload(payload));
    return { ...data, data: mapCustomer(data.data || {}) };
  },

  deactivate: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/customers/${id}`);
    return data;
  },

  getSubscriptions: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/subscriptions`, { params });
    return data;
  },

  getInvoices: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/invoices`, { params });
    return data;
  },

  getPayments: async (id: string, params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/customers/${id}/payments`, { params });
    return data;
  },

  getBalance: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/customers/${id}/balance`);
    return data;
  },
};
