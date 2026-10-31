/**
 * src/api/reportApi.ts
 */
import api, { ApiResponse } from './axios';

interface ReportParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  customer_id?: string;
  method?: string;
  page?: number;
  per_page?: number;
}

export const reportApi = {
  getRevenue: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/revenue', { params });
    return data;
  },

  getSubscriptions: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/subscriptions', { params });
    return data;
  },

  getPayments: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/payments', { params });
    return data;
  },

  getInvoices: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/invoices', { params });
    return data;
  },

  getOverdue: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/overdue', { params });
    return data;
  },

  getCustomers: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/customers', { params });
    return data;
  },

  getProducts: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/products', { params });
    return data;
  },

  getDiscounts: async (params?: ReportParams) => {
    const { data } = await api.get<ApiResponse<any[]>>('/reports/discounts', { params });
    return data;
  },

  // Financial summary for analytics (used by OverviewDashboard)
  getFinancialSummary: async () => {
    const { data } = await api.get<ApiResponse<any>>('/dashboard/revenue-summary');
    return data;
  },
};
