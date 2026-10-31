/**
 * src/api/portalApi.ts — Customer self-service portal API
 */
import api, { ApiResponse } from './axios';

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
    const { data } = await api.get<ApiResponse<any[]>>('/portal/plans');
    return data;
  },

  getSubscriptions: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/portal/subscriptions');
    return data;
  },

  getSubscription: async (id: string) => {
    const { data } = await api.get<ApiResponse<any>>(`/portal/subscriptions/${id}`);
    return data;
  },

  getInvoices: async () => {
    const { data } = await api.get<ApiResponse<any[]>>('/portal/invoices');
    return data;
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
    const { data } = await api.get<ApiResponse<any[]>>('/portal/payments');
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
    const [profile, subs, invoices, payments, plans] = await Promise.all([
      portalApi.getProfile(),
      portalApi.getSubscriptions(),
      portalApi.getInvoices(),
      portalApi.getPayments(),
      portalApi.getPlans(),
    ]);
    return {
      data: {
        customer: profile.data,
        subscriptions: subs.data,
        invoices: invoices.data,
        payments: payments.data,
        availablePlans: plans.data,
      },
      success: true,
    };
  },
};
