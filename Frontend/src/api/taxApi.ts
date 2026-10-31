/**
 * src/api/taxApi.ts
 */
import api, { ApiResponse } from './axios';
import type { TaxRule } from '../types';

type TaxRecord = Record<string, unknown>;

const asRecord = (value: unknown): TaxRecord =>
  value && typeof value === 'object' ? value as TaxRecord : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';
const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapTax = (value: unknown): TaxRule => {
  const record = asRecord(value);
  const taxType = record.tax_type ?? record.type;
  const status = record.status;

  return {
    id: asString(record.id),
    name: asString(record.name),
    percentage: asNumber(record.percentage),
    type: taxType === 'vat' || taxType === 'gst' ? taxType : 'sales',
    applicableProductIds: Array.isArray(record.applicable_product_ids ?? record.applicableProductIds)
      ? (record.applicable_product_ids ?? record.applicableProductIds) as string[]
      : [],
    startDate: asString(record.start_date ?? record.startDate),
    endDate: asString(record.end_date ?? record.endDate) || undefined,
    status: status === 'inactive' ? 'inactive' : 'active',
  };
};

const toTaxPayload = (payload: Partial<TaxRule>) => {
  const { type, applicableProductIds, startDate, endDate, ...rest } = payload;
  return {
    ...rest,
    ...(type !== undefined ? { tax_type: type } : {}),
    ...(applicableProductIds !== undefined ? { applicable_product_ids: applicableProductIds } : {}),
    ...(startDate !== undefined ? { start_date: startDate } : {}),
    ...(endDate !== undefined ? { end_date: endDate } : {}),
  };
};

export const taxApi = {
  getAll: async (params?: { status?: string }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/taxes', { params });
    return { ...data, data: Array.isArray(data.data) ? data.data.map(mapTax) : [] };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/taxes/${id}`);
    return { ...data, data: mapTax(data.data) };
  },

  create: async (payload: Partial<TaxRule>) => {
    const { data } = await api.post<ApiResponse<unknown>>('/taxes', toTaxPayload(payload));
    return { ...data, data: mapTax(data.data) };
  },

  update: async (id: string, payload: Partial<TaxRule>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/taxes/${id}`, toTaxPayload(payload));
    return { ...data, data: mapTax(data.data) };
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/taxes/${id}`);
    return data;
  },

  calculate: async (productId: string, amount: number) => {
    const { data } = await api.post<ApiResponse<any>>('/taxes/calculate', {
      product_id: productId,
      amount,
    });
    return data;
  },
};
