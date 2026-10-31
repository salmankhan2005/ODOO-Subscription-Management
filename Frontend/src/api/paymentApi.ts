/**
 * src/api/paymentApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Payment } from '../types';

type PaymentRecord = Record<string, unknown>;

const asRecord = (value: unknown): PaymentRecord =>
  value && typeof value === 'object' ? value as PaymentRecord : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';
const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapPayment = (value: unknown): Payment => {
  const record = asRecord(value);
  const customer = asRecord(record.customers ?? record.customer);
  const allocations = Array.isArray(record.payment_allocations) ? record.payment_allocations : [];
  const invoiceNumbers = allocations
    .map((allocation) => {
      const item = asRecord(allocation);
      const invoice = asRecord(item.invoices ?? item.invoice);
      return asString(invoice.invoice_number ?? invoice.invoiceNumber);
    })
    .filter(Boolean);
  const firstAllocation = asRecord(allocations[0]);
  const method = record.payment_method ?? record.method;
  const methods: Payment['method'][] = ['Card', 'Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other'];
  const status = record.status;

  return {
    id: asString(record.id),
    paymentReference: asString(record.payment_reference ?? record.paymentReference),
    customerId: asString(record.customer_id ?? record.customerId),
    customerName: asString(customer.name ?? record.customerName) || 'Unknown customer',
    invoiceId: asString(firstAllocation.invoice_id ?? record.invoice_id ?? record.invoiceId),
    invoiceNumber: invoiceNumbers.join(', ') || asString(record.invoice_number ?? record.invoiceNumber),
    method: methods.includes(method as Payment['method']) ? method as Payment['method'] : 'Other',
    amount: asNumber(record.amount),
    paymentDate: asString(record.payment_date ?? record.paymentDate ?? record.created_at),
    transactionReference: asString(record.transaction_reference ?? record.transactionReference),
    notes: asString(record.notes) || undefined,
    status: status === 'pending' || status === 'failed' || status === 'refunded' ? status : 'completed',
  };
};

const mapPaymentResponse = (response: ApiResponse<unknown>) => ({
  ...response,
  data: mapPayment(response.data),
});

export const paymentApi = {
  getAll: async (params?: { customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/payments', { params });
    return { ...data, data: Array.isArray(data.data) ? data.data.map(mapPayment) : [] };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/payments/${id}`);
    return mapPaymentResponse(data);
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
    return mapPaymentResponse(data);
  },

  update: async (id: string, payload: Partial<Payment>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/payments/${id}`, {
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.transactionReference !== undefined
        ? { transaction_reference: payload.transactionReference }
        : {}),
    });
    return mapPaymentResponse(data);
  },

  refund: async (id: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<unknown>>(`/payments/${id}/refund`, { reason });
    return mapPaymentResponse(data);
  },

  getAllocations: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/payments/${id}/allocations`);
    return data;
  },
};
