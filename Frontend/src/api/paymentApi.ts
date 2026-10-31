/**
 * src/api/paymentApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Payment, PaymentMethod } from '../types';

type PaymentRecord = Record<string, unknown>;

const asRecord = (value: unknown): PaymentRecord =>
  value && typeof value === 'object' ? (value as PaymentRecord) : {};

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const validMethods: PaymentMethod[] = ['Card', 'Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other'];

export const mapPayment = (value: unknown): Payment => {
  const record = asRecord(value);

  // The backend flattens customer info directly onto the payment row
  // AND also returns the nested Supabase join object — handle both patterns.
  const customer = asRecord(record.customers);
  const customerName =
    asString(record.customer_name) ||
    asString(customer.name) ||
    asString(record.customerName) ||
    '—';

  // payment_allocations is an array from the Supabase join
  const allocations = Array.isArray(record.payment_allocations)
    ? record.payment_allocations
    : [];
  const firstAlloc = asRecord(allocations[0]);
  const invoiceFromAlloc = asRecord(firstAlloc.invoices);

  const invoiceNumber =
    asString(record.invoice_number) ||
    asString(invoiceFromAlloc.invoice_number) ||
    asString(record.invoiceNumber) ||
    '—';

  const invoiceId =
    asString(record.invoice_id) ||
    asString(firstAlloc.invoice_id) ||
    asString(record.invoiceId) ||
    '';

  // payment_method is the DB column name; method is used in some places too
  const rawMethod = asString(record.payment_method ?? record.method ?? '');
  const method = validMethods.includes(rawMethod as PaymentMethod)
    ? (rawMethod as PaymentMethod)
    : 'Card';

  const rawStatus = asString(record.status ?? '').toLowerCase();
  const status =
    rawStatus === 'completed' || rawStatus === 'pending' || rawStatus === 'failed'
      ? (rawStatus as Payment['status'])
      : 'completed';

  return {
    id: asString(record.id),
    paymentReference: asString(record.payment_reference ?? record.paymentReference),
    customerId: asString(record.customer_id ?? record.customerId),
    customerName,
    invoiceId,
    invoiceNumber,
    method,
    amount: asNumber(record.amount),
    paymentDate: asString(record.payment_date ?? record.paymentDate),
    transactionReference: asString(record.transaction_reference ?? record.transactionReference),
    notes: asString(record.notes ?? ''),
    status,
  };
};

export const paymentApi = {
  getAll: async (params?: { customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/payments', { params });
    // Debug: log raw API response to help trace field mapping issues
    if (data.data?.length) {
      console.debug('[paymentApi] raw[0]:', JSON.stringify(data.data[0], null, 2));
    }
    return { ...data, data: (data.data || []).map(mapPayment) };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/payments/${id}`);
    return { ...data, data: mapPayment(data.data) };
  },

  record: async (payload: {
    invoice_id: string;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
    payment_date?: string;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiResponse<unknown>>('/payments', payload);
    return { ...data, data: mapPayment(data.data) };
  },

  update: async (id: string, payload: Partial<Payment>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/payments/${id}`, payload);
    return { ...data, data: mapPayment(data.data) };
  },

  refund: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<unknown>>(`/payments/${id}/refund`, { reason });
    return { ...data, data: mapPayment(data.data) };
  },

  getAllocations: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/payments/${id}/allocations`);
    return data;
  },
};
