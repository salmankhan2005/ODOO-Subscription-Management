/**
 * src/api/dashboardApi.ts
 */
import api, { ApiResponse } from './axios';

export const dashboardApi = {
  getAdminDashboard: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/admin');
    return data;
  },

  getStaffDashboard: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/staff');
    return data;
  },

  getCustomerDashboard: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/customer');
    return data;
  },

  getRevenueSummary: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/revenue-summary');
    return data;
  },

  getSubscriptionSummary: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/subscription-summary');
    return data;
  },

  getPaymentSummary: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/payment-summary');
    return data;
  },

  getOverdueSummary: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/overdue-summary');
    return data;
  },
};
