/**
 * src/api/productApi.ts
 */
import api, { ApiResponse } from './axios';
import type { Product, ProductVariant } from '../types';

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  value && typeof value === 'object' ? value as RecordValue : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';
const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapVariant = (value: unknown): ProductVariant => {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    name: asString(record.name),
    additionalPrice: asNumber(record.additional_price ?? record.additionalPrice),
    sku: asString(record.sku) || undefined,
  };
};

const mapProduct = (value: unknown): Product => {
  const record = asRecord(value);
  const variants = Array.isArray(record.product_variants)
    ? record.product_variants
    : Array.isArray(record.variants)
      ? record.variants
      : [];
  const productType = record.product_type ?? record.type;
  const status = record.status === 'archived' ? 'archived' : 'active';

  return {
    id: asString(record.id),
    name: asString(record.name),
    type: productType === 'service' || productType === 'addon' ? productType : 'software',
    salesPrice: asNumber(record.sales_price ?? record.salesPrice),
    costPrice: asNumber(record.cost_price ?? record.costPrice),
    description: asString(record.description),
    notes: asString(record.notes),
    variants: variants.map(mapVariant),
    status,
    createdAt: asString(record.created_at ?? record.createdAt),
  };
};

const mapProductResponse = (response: ApiResponse<unknown>, value: unknown) => ({
  ...response,
  data: mapProduct(value),
});

const toProductPayload = (payload: Partial<Product>) => {
  const { type, salesPrice, costPrice, ...rest } = payload;
  return {
    ...rest,
    ...(type !== undefined ? { product_type: type } : {}),
    ...(salesPrice !== undefined ? { sales_price: salesPrice } : {}),
    ...(costPrice !== undefined ? { cost_price: costPrice } : {}),
  };
};

export const productApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/products', { params });
    return { ...data, data: Array.isArray(data.data) ? data.data.map(mapProduct) : [] };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/products/${id}`);
    return mapProductResponse(data, data.data);
  },

  create: async (payload: Partial<Product>) => {
    const { data } = await api.post<ApiResponse<unknown>>('/products', toProductPayload(payload));
    return mapProductResponse(data, data.data);
  },

  update: async (id: string, payload: Partial<Product>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/products/${id}`, toProductPayload(payload));
    return mapProductResponse(data, data.data);
  },

  archive: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return data;
  },

  getVariants: async (productId: string) => {
    const { data } = await api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`);
    return data;
  },

  addVariant: async (productId: string, payload: Partial<ProductVariant>) => {
    const { additionalPrice, ...rest } = payload;
    const { data } = await api.post<ApiResponse<unknown>>(`/products/${productId}/variants`, {
      ...rest,
      ...(additionalPrice !== undefined ? { additional_price: additionalPrice } : {}),
    });
    return { ...data, data: mapVariant(data.data) };
  },

  updateVariant: async (variantId: string, payload: Partial<ProductVariant>) => {
    const { additionalPrice, ...rest } = payload;
    const { data } = await api.put<ApiResponse<unknown>>(`/variants/${variantId}`, {
      ...rest,
      ...(additionalPrice !== undefined ? { additional_price: additionalPrice } : {}),
    });
    return { ...data, data: mapVariant(data.data) };
  },

  deleteVariant: async (variantId: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/variants/${variantId}`);
    return data;
  },
};
