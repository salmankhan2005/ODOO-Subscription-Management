/**
 * src/api/invoiceApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Invoice, InvoiceStatus } from '../types';

type InvoiceRecord = Record<string, unknown>;

const invoiceRecord = (value: unknown): InvoiceRecord =>
  value && typeof value === 'object' ? value as InvoiceRecord : {};

const invoiceString = (value: unknown) => typeof value === 'string' ? value : '';

const invoiceNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapInvoice = (value: unknown): Invoice => {
  const record = invoiceRecord(value);
  const customer = invoiceRecord(record.customers);
  const lines = Array.isArray(record.invoice_lines)
    ? record.invoice_lines
    : Array.isArray(record.lines)
      ? record.lines
      : [];
  const statuses: InvoiceStatus[] = [
    'draft', 'confirmed', 'paid', 'partially_paid', 'overdue', 'cancelled',
  ];
  const status = invoiceString(record.status);

  return {
    id: invoiceString(record.id),
    invoiceNumber: invoiceString(record.invoice_number ?? record.invoiceNumber),
    customerId: invoiceString(record.customer_id ?? record.customerId),
    customerName: invoiceString(customer.name ?? record.customerName),
    customerEmail: invoiceString(customer.email ?? record.customerEmail),
    subscriptionId: invoiceString(record.subscription_id ?? record.subscriptionId) || undefined,
    subscriptionNumber: invoiceString(record.subscription_number ?? record.subscriptionNumber) || undefined,
    invoiceDate: invoiceString(record.invoice_date ?? record.invoiceDate),
    dueDate: invoiceString(record.due_date ?? record.dueDate),
    lines: lines.map((value) => {
      const line = invoiceRecord(value);
      return {
        id: invoiceString(line.id),
        productId: invoiceString(line.product_id),
        productName: invoiceString(line.description ?? line.product_name),
        variantId: invoiceString(line.variant_id) || undefined,
        quantity: invoiceNumber(line.quantity),
        unitPrice: invoiceNumber(line.unit_price),
        taxRate: invoiceNumber(line.tax_percentage ?? line.tax_rate),
        taxAmount: invoiceNumber(line.tax_amount),
        discountAmount: invoiceNumber(line.discount_amount),
        subtotal: invoiceNumber(line.subtotal),
        total: invoiceNumber(line.line_total ?? line.total),
      };
    }),
    subtotal: invoiceNumber(record.subtotal),
    discountTotal: invoiceNumber(record.discount_amount ?? record.discountTotal),
    taxTotal: invoiceNumber(record.tax_amount ?? record.taxTotal),
    totalAmount: invoiceNumber(record.total_amount ?? record.totalAmount),
    amountPaid: invoiceNumber(record.amount_paid ?? record.amountPaid),
    outstandingBalance: invoiceNumber(record.amount_due ?? record.outstandingBalance),
    status: statuses.includes(status as InvoiceStatus) ? status as InvoiceStatus : 'draft',
    notes: invoiceString(record.notes) || undefined,
    pdfUrl: invoiceString(record.pdf_url ?? record.pdfUrl) || undefined,
    sentDate: invoiceString(record.sent_at ?? record.sentDate) || undefined,
  };
};

export const invoiceApi = {
  getAll: async (params?: { status?: string; customer_id?: string; page?: number; per_page?: number }) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data;
  },

  generate: async (subscriptionId: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>('/invoices/generate', {
      subscription_id: subscriptionId,
    });
    return data;
  },

  confirm: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/confirm`);
    return data;
  },

  send: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/send`);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/cancel`);
    return data;
  },

  update: async (id: string, payload: Partial<Invoice>) => {
    const { data } = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload);
    return data;
  },

  downloadPdf: async (id: string) => {
    const { data } = await api.get<Blob>(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  getPayments: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/invoices/${id}/payments`);
    return data;
  },

  getOverdue: async (params?: { page?: number }) => {
    const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices/overdue', { params });
    return data;
  },
};
