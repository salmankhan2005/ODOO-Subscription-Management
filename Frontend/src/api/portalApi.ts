/**
 * src/api/portalApi.ts — Customer self-service portal API
 */
import api, { ApiResponse } from './axios';
import { mapCustomer } from './customerApi';
import { mapInvoice } from './invoiceApi';
import { mapPlan } from './planApi';
import { mapSubscription } from './subscriptionApi';
import {
  Payment,
  PaymentMethod,
  PlanRecommendation,
  SubscriptionOptimizationRecommendation,
} from '../types';

const paymentMethods: PaymentMethod[] = [
  'Card',
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Other',
];

const mapPortalPayment = (value: unknown): Payment => {
  const payment = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
  const method = payment.payment_method;
  const status = payment.status;
  const paymentStatus: Payment['status'] =
    status === 'completed' || status === 'failed' ? status : 'pending';

  return {
    id: typeof payment.id === 'string' ? payment.id : '',
    paymentReference: typeof payment.payment_reference === 'string'
      ? payment.payment_reference
      : '',
    customerId: typeof payment.customer_id === 'string' ? payment.customer_id : '',
    customerName: typeof payment.customer_name === 'string' ? payment.customer_name : '',
    invoiceId: typeof payment.invoice_id === 'string' ? payment.invoice_id : '',
    invoiceNumber: typeof payment.invoice_number === 'string' ? payment.invoice_number : '',
    method: paymentMethods.find((item) => item === method) || 'Other',
    amount: typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0,
    paymentDate: typeof payment.payment_date === 'string' ? payment.payment_date : '',
    transactionReference: typeof payment.transaction_reference === 'string'
      ? payment.transaction_reference
      : '',
    notes: typeof payment.notes === 'string' ? payment.notes : '',
    status: paymentStatus,
  };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {};

const asString = (value: unknown) => typeof value === 'string' ? value : '';
const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapPlanRecommendation = (value: unknown): PlanRecommendation => {
  const record = asRecord(value);
  return {
    ...mapPlan(record),
    popularityCount: asNumber(record.popularity_count),
    customerCount: asNumber(record.customer_count),
    recommendationScore: asNumber(record.recommendation_score),
    recommendationReasons: Array.isArray(record.recommendation_reasons)
      ? record.recommendation_reasons.filter((reason): reason is string => typeof reason === 'string')
      : [],
  };
};

const mapOptimizationRecommendation = (value: unknown): SubscriptionOptimizationRecommendation => {
  const record = asRecord(value);
  const action = record.action;
  return {
    subscriptionId: asString(record.subscription_id),
    subscriptionNumber: asString(record.subscription_number),
    currentPlanId: asString(record.current_plan_id),
    currentPlanName: asString(record.current_plan_name),
    alternativePlanId: asString(record.alternative_plan_id),
    alternativePlanName: asString(record.alternative_plan_name),
    action: action === 'downgrade' || action === 'review_unused_subscription'
      ? action
      : 'upgrade',
    confidence: typeof record.confidence === 'number' ? record.confidence : undefined,
    currentMonthlyCost: asNumber(record.current_monthly_cost),
    alternativeMonthlyCost: asNumber(record.alternative_monthly_cost),
  };
};

export const portalApi = {
  getProfile: async () => {
    const { data } = await api.get<ApiResponse<any>>('/portal/profile');
    return data;
  },

  updateProfile: async (payload: any) => {
    const { data } = await api.put<ApiResponse<any>>('/portal/profile', payload);
    return data;
  },

  getProducts: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/portal/products');
    return data;
  },

  getPlans: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/portal/plans');
    return { ...data, data: (data.data || []).map(mapPlan) };
  },

  getRecommendations: async () => {
    const { data } = await api.get<ApiResponse<{
      plans: unknown[];
      optimizer_recommendations?: unknown[];
    }>>('/portal/recommendations');
    return {
      ...data,
      data: {
        plans: (data.data?.plans || []).map(mapPlanRecommendation),
        optimizerRecommendations: (data.data?.optimizer_recommendations || [])
          .map(mapOptimizationRecommendation),
      },
    };
  },

  getSubscriptions: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/portal/subscriptions');
    return { ...data, data: (data.data || []).map(mapSubscription) };
  },

  getSubscription: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/portal/subscriptions/${id}`);
    return data;
  },

  getInvoices: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/portal/invoices');
    return { ...data, data: (data.data || []).map(mapInvoice) };
  },

  getInvoice: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/portal/invoices/${id}`);
    return data;
  },

  downloadInvoicePdf: async (id: string) => {
    const { data } = await api.get<Blob>(`/portal/invoices/${id}/pdf`, {
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

  getPayments: async () => {
    const { data } = await api.get<ApiResponse<unknown[]>>('/portal/payments');
    return {
      ...data,
      data: (data.data || []).map(mapPortalPayment),
    };
  },

  purchasePlan: async (planId: string, payload: {
    quantity: number;
    payment_method: string;
    transaction_reference?: string;
    billing_address: string;
    country: string;
    phone?: string;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiResponse<{
      subscription_id: string;
      subscription_number: string;
      invoice_id: string;
      payment_id: string;
      payment_reference: string;
      total_amount: number;
    }>>(`/portal/plans/${planId}/purchase`, payload);
    return data;
  },

  createStripeCheckout: async (planId: string, payload: {
    quantity: number;
    billing_address: string;
    country: string;
    phone?: string;
    notes?: string;
  }) => {
    const { data } = await api.post<ApiResponse<{ checkout_url: string }>>(
      `/portal/plans/${planId}/checkout`, payload
    );
    return data;
  },

  confirmStripePayment: async (sessionId: string) => {
    const { data } = await api.post<ApiResponse<any>>('/portal/payments/stripe/confirm', {
      session_id: sessionId,
    });
    return data;
  },

  requestCancel: async (subscriptionId: string, reason?: string) => {
    const { data } = await api.post<ApiResponse<null>>(
      `/portal/subscriptions/${subscriptionId}/cancel-request`,
      { reason }
    );
    return data;
  },

  requestPause: async (subscriptionId: string) => {
    const { data } = await api.post<ApiResponse<null>>(
      `/portal/subscriptions/${subscriptionId}/pause-request`
    );
    return data;
  },

  requestRenew: async (subscriptionId: string) => {
    const { data } = await api.post<ApiResponse<null>>(
      `/portal/subscriptions/${subscriptionId}/renew-request`
    );
    return data;
  },

  // Helper: aggregate customer data in one call
  getCustomerData: async () => {
    const [profile, subs, invoices, payments, recommendations] = await Promise.all([
      portalApi.getProfile(),
      portalApi.getSubscriptions(),
      portalApi.getInvoices(),
      portalApi.getPayments(),
      portalApi.getRecommendations(),
    ]);
    return {
      data: {
        customer: mapCustomer(profile.data || {}),
        subscriptions: subs.data,
        invoices: invoices.data,
        payments: payments.data,
        availablePlans: recommendations.data.plans,
        optimizerRecommendations: recommendations.data.optimizerRecommendations,
      },
      success: true,
    };
  },
};
