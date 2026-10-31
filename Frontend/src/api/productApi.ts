/**
 * src/api/productApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Product, ProductVariant } from '../types';

type ProductRecord = Record<string, unknown>;

const asRecord = (value: unknown): ProductRecord =>
  value && typeof value === 'object' ? (value as ProductRecord) : {};

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapVariant = (value: unknown): ProductVariant => {
  const vr = asRecord(value);
  return {
    id: asString(vr.id),
    name: asString(vr.name),
    sku: asString(vr.sku) || undefined,
    additionalPrice: asNumber(vr.additional_price ?? vr.additionalPrice),
  };
};

export const mapProduct = (value: unknown): Product => {
  const record = asRecord(value);
  const rawVariants = Array.isArray(record.product_variants)
    ? record.product_variants
    : Array.isArray(record.variants)
      ? record.variants
      : [];

  const variants: ProductVariant[] = rawVariants.map(mapVariant);

  return {
    id: asString(record.id),
    name: asString(record.name),
    type: (['software', 'service', 'addon'].includes(asString(record.product_type ?? record.type))
      ? asString(record.product_type ?? record.type)
      : 'software') as Product['type'],
    salesPrice: asNumber(record.sales_price ?? record.salesPrice),
    costPrice: asNumber(record.cost_price ?? record.costPrice),
    description: asString(record.description),
    notes: asString(record.notes),
    variants,
    status: record.status === 'archived' ? 'archived' : 'active',
    createdAt: asString(record.created_at ?? record.createdAt),
  };
};

const toProductPayload = (payload: Partial<Product>) => {
  const result: Record<string, unknown> = { ...payload };
  if (payload.salesPrice !== undefined) {
    result.sales_price = payload.salesPrice;
  }
  if (payload.costPrice !== undefined) {
    result.cost_price = payload.costPrice;
  }
  if (payload.type !== undefined) {
    result.product_type = payload.type;
  }
  return result;
};

const toVariantPayload = (payload: Partial<ProductVariant>) => {
  const result: Record<string, unknown> = { ...payload };
  if (payload.additionalPrice !== undefined) {
    result.additional_price = payload.additionalPrice;
  }
  return result;
};

export const productApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/products', { params });
    return { ...data, data: (data.data || []).map(mapProduct) };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/products/${id}`);
    return { ...data, data: mapProduct(data.data) };
  },

  create: async (payload: Partial<Product>) => {
    const { data } = await api.post<ApiResponse<unknown>>('/products', toProductPayload(payload));
    return { ...data, data: mapProduct(data.data) };
  },

  update: async (id: string, payload: Partial<Product>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/products/${id}`, toProductPayload(payload));
    return { ...data, data: mapProduct(data.data) };
  },

  archive: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return data;
  },

  getVariants: async (productId: string) => {
    const { data } = await api.get<ApiResponse<unknown[]>>(`/products/${productId}/variants`);
    return { ...data, data: (data.data || []).map(mapVariant) };
  },

  addVariant: async (productId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.post<ApiResponse<unknown>>(`/products/${productId}/variants`, toVariantPayload(payload));
    return { ...data, data: mapVariant(data.data) };
  },

  updateVariant: async (variantId: string, payload: Partial<ProductVariant>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/variants/${variantId}`, toVariantPayload(payload));
    return { ...data, data: mapVariant(data.data) };
  },

  deleteVariant: async (variantId: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/variants/${variantId}`);
    return data;
  },
};
