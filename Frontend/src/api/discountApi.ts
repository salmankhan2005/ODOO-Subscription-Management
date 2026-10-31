/**
 * src/api/discountApi.ts
 */
import api, { ApiResponse } from './axios';
import type { DiscountRule } from '../types';

type DiscountRecord = Record<string, unknown>;

const asRecord = (value: unknown): DiscountRecord =>
  value && typeof value === 'object' ? value as DiscountRecord : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';
const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapDiscount = (value: unknown): DiscountRule => {
  const record = asRecord(value);
  const discountType = record.discount_type ?? record.type;
  const status = record.status;

  return {
    id: asString(record.id),
    name: asString(record.name),
    code: asString(record.code),
    type: discountType === 'fixed' ? 'fixed' : 'percentage',
    value: asNumber(record.value),
    minimumPurchase: asNumber(record.minimum_purchase ?? record.minimumPurchase),
    minimumQuantity: asNumber(record.minimum_quantity ?? record.minimumQuantity),
    applicableProductIds: Array.isArray(record.applicable_product_ids ?? record.applicableProductIds)
      ? (record.applicable_product_ids ?? record.applicableProductIds) as string[]
      : [],
    applicableSubscriptions: Boolean(record.applicable_subscriptions ?? record.applicableSubscriptions),
    startDate: asString(record.start_date ?? record.startDate),
    endDate: asString(record.end_date ?? record.endDate),
    usageCount: asNumber(record.current_usage_count ?? record.usage_count ?? record.usageCount),
    maxUsage: asNumber(record.max_usage ?? record.maxUsage),
    status: status === 'expired' || status === 'disabled' ? status : 'active',
  };
};

const toDiscountPayload = (payload: Partial<DiscountRule>) => {
  const {
    type,
    minimumPurchase,
    minimumQuantity,
    applicableProductIds,
    applicableSubscriptions,
    startDate,
    endDate,
    usageCount,
    maxUsage,
    ...rest
  } = payload;
  return {
    ...rest,
    ...(type !== undefined ? { discount_type: type } : {}),
    ...(minimumPurchase !== undefined ? { minimum_purchase: minimumPurchase } : {}),
    ...(minimumQuantity !== undefined ? { minimum_quantity: minimumQuantity } : {}),
    ...(applicableProductIds !== undefined ? { applicable_product_ids: applicableProductIds } : {}),
    ...(applicableSubscriptions !== undefined ? { applicable_subscriptions: applicableSubscriptions } : {}),
    ...(startDate !== undefined ? { start_date: startDate } : {}),
    ...(endDate !== undefined ? { end_date: endDate } : {}),
    ...(usageCount !== undefined ? { current_usage_count: usageCount } : {}),
    ...(maxUsage !== undefined ? { max_usage: maxUsage } : {}),
  };
};

export const discountApi = {
  getAll: async (params?: { status?: string }) => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/discounts', { params });
    return { ...data, data: Array.isArray(data.data) ? data.data.map(mapDiscount) : [] };
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<unknown>>(`/discounts/${id}`);
    return { ...data, data: mapDiscount(data.data) };
  },

  create: async (payload: Partial<DiscountRule>) => {
    const { data } = await api.post<ApiResponse<unknown>>('/discounts', toDiscountPayload(payload));
    return { ...data, data: mapDiscount(data.data) };
  },

  update: async (id: string, payload: Partial<DiscountRule>) => {
    const { data } = await api.put<ApiResponse<unknown>>(`/discounts/${id}`, toDiscountPayload(payload));
    return { ...data, data: mapDiscount(data.data) };
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/discounts/${id}`);
    return data;
  },

  validate: async (code: string, productIds: string[], amount: number, quantity: number) => {
    const { data } = await api.post<ApiResponse<any>>('/discounts/validate', {
      code,
      product_ids: productIds,
      amount,
      quantity,
    });
    return data;
  },

  getUsage: async (id: string) => {
    const { data } = await api.get<ApiResponse<any[]>>(`/discounts/${id}/usage`);
    return data;
  },
};
