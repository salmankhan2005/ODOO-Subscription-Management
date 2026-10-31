import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { reportApi, subscriptionApi, invoiceApi, customerApi, dashboardApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Zap,
  Plus,
  Receipt
} from 'lucide-react';
import { Subscription, Invoice, Customer } from '../../types';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    activeSubscriptionsCount: 0,
    totalCustomersCount: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    overdueAmount: 0,
    upcomingRenewalsCount: 0
  });

  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const monthlyBars = [
    { month: 'May', val: 74200, pct: 74, growth: '+5.2%' },
    { month: 'Jun', val: 79800, pct: 80, growth: '+7.5%' },
    { month: 'Jul', val: 84100, pct: 84, growth: '+5.4%' },
    { month: 'Aug', val: 88500, pct: 88, growth: '+5.2%' },
    { month: 'Sep', val: 91400, pct: 92, growth: '+3.3%' },
    { month: 'Oct (Current)', val: 94820, pct: 100, growth: '+3.7%', active: true },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        if (role === 'admin') {
          const summaryRes = await reportApi.getFinancialSummary();
          if (summaryRes.success && summaryRes.data) {
            setMetrics((current) => ({
              ...current,
              mrr: summaryRes.data.mrr,
              arr: summaryRes.data.arr,
              totalCollected: summaryRes.data.total_collected,
              totalOutstanding: summaryRes.data.total_outstanding,
            }));
          }
        } else {
          const summaryRes = await dashboardApi.getStaffDashboard();
          if (summaryRes.success && summaryRes.data) {
            setMetrics((current) => ({
              ...current,
              activeSubscriptionsCount: summaryRes.data.active_subscriptions,
              totalCustomersCount: summaryRes.data.total_customers,
              overdueCount: summaryRes.data.overdue_invoices,
              upcomingRenewalsCount: summaryRes.data.upcoming_renewals,
            }));
          }
        }
        const subsRes = await subscriptionApi.getAll();
        if (subsRes.success) {
          setRecentSubscriptions(subsRes.data.slice(0, 5));
          setMetrics((current) => ({
            ...current,
            activeSubscriptionsCount: subsRes.data.filter((subscription) => subscription.status === 'active').length,
          }));
        }

        const invsRes = await invoiceApi.getAll();
        if (invsRes.success) {
          setRecentInvoices(invsRes.data.slice(0, 5));
          const overdueInvoices = invsRes.data.filter((invoice) => invoice.status === 'overdue');
          setMetrics((current) => ({
            ...current,
            overdueCount: overdueInvoices.length,
            overdueAmount: overdueInvoices.reduce((total, invoice) => total + invoice.outstandingBalance, 0),
          }));
        }

        const custRes = await customerApi.getAll({ per_page: 100 });
        if (custRes.success) {
          setCustomers(custRes.data);
          const totalCount = custRes.pagination?.total || custRes.data.length;
          setMetrics((current) => ({ ...current, totalCustomersCount: totalCount }));
        }
      } catch (error) {
        const responseMessage = axios.isAxiosError(error) &&
          error.response?.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
          ? error.response.data.message
          : undefined;
        showToast('Dashboard data could not be loaded', {
          type: 'error',
          message: responseMessage || (error instanceof Error ? error.message : 'Please try again.'),
        });
      }
    };

    void loadData();
  }, [role, showToast]);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Business Overview & Revenue Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time subscription metrics, billing health, and recurring cash flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('billing')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AI Billing Run</span>
          </button>
          <button
            onClick={() => onNavigate('quotations')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Quote</span>
          </button>
        </div>
      </div>

      {/* 8 Bento KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* MRR */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            ${(metrics.mrr ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12.4% vs last cycle</span>
          </div>
        </BentoCard>

        {/* ARR */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Annual Run-Rate (ARR)</span>
            <Repeat className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            ${(metrics.arr ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Based on active contracts</div>
        </BentoCard>

        {/* Active Subscriptions */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Subscriptions</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {metrics.activeSubscriptionsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">0 unbilled accounts</div>
        </BentoCard>

        {/* Total Customers */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {metrics.totalCustomersCount || customers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-tier enterprises</div>
        </BentoCard>

        {/* Total Collected */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Revenue Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            ${(metrics.totalCollected ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Direct card & wire settlement</div>
        </BentoCard>

        {/* Outstanding Amount */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Outstanding Balance</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
            ${(metrics.totalOutstanding ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Within standard Net 30 terms</div>
        </BentoCard>

        {/* Overdue Invoices */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overdue Invoices</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            ${(metrics.overdueAmount ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {metrics.overdueCount} account in dunning retry
          </div>
        </BentoCard>

        {/* Upcoming Renewals */}
        <BentoCard glow className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Upcoming Renewals</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
            {metrics.upcomingRenewalsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Next 14 business days</div>
        </BentoCard>
      </div>

      {/* Bento Middle Grid: Interactive Revenue Trend & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Monthly Revenue Cadence Progression */}
        <BentoCard
          title="Revenue Realization Progression"
          subtitle="Realized recurring collections vs forecasted expansion"
          className="lg:col-span-8"
          headerAction={
            hoveredBarIndex !== null ? (
              <div className="text-xs font-medium text-[#1F3F47] bg-[#DDF3F0] px-3 py-1 rounded-lg border border-[#2E9F92]/40 animate-in fade-in duration-150 flex items-center gap-2">
                <span className="font-bold">{monthlyBars[hoveredBarIndex].month}:</span>
                <span className="font-mono font-semibold">${monthlyBars[hoveredBarIndex].val.toLocaleString()}</span>
                <span className="text-[#2E9F92] font-semibold font-mono text-[11px]">({monthlyBars[hoveredBarIndex].growth} YoY)</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">Hover bars for details</span>
            )
          }
        >
          <div className="mt-2 space-y-4">
            <div className="relative pt-2">
              {/* Reference Grid lines */}
              <div className="absolute inset-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="border-b border-slate-300 w-full" />
              </div>

              {/* Bar columns */}
              <div className="relative z-10 grid grid-cols-6 gap-2 sm:gap-3 text-center text-xs">
                {monthlyBars.map((bar, idx) => {
                  const isHovered = hoveredBarIndex === idx;
                  return (
                    <div
                      key={bar.month}
                      className="group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Metric value above bar */}
                      <div
                        className={`text-[11px] font-mono mb-2 transition-colors ${
                          bar.active || isHovered
                            ? 'text-[#1F3F47] font-bold scale-105'
                            : 'text-slate-600 font-medium'
                        }`}
                      >
                        ${(bar.val / 1000).toFixed(1)}k
                      </div>

                      {/* Visible trough track */}
                      <div className="w-full max-w-[46px] h-36 bg-[#EDF3F3] border border-[#D5E2E2] rounded-t-xl relative flex items-end overflow-hidden shadow-inner">
                        <div
                          style={{ height: `${bar.pct}%` }}
                          className={`w-full transition-all duration-500 rounded-t-xl ${
                            bar.active
                              ? 'bg-gradient-to-t from-[#1F3F47] to-[#2E9F92] shadow-md shadow-[#2E9F92]/30'
                              : isHovered
                              ? 'bg-[#2E9F92]'
                              : 'bg-[#345C64]/75 hover:bg-[#345C64]'
                          }`}
                        />
                      </div>

                      {/* Month label beneath bar */}
                      <div
                        className={`text-[11px] mt-2 transition-colors ${
                          bar.active
                            ? 'text-[#1F3F47] font-bold'
                            : isHovered
                            ? 'text-[#2E9F92] font-semibold'
                            : 'text-slate-600 font-medium'
                        }`}
                      >
                        {bar.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend & Target metrics */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#1F3F47] to-[#2E9F92] shadow-sm" />
                  Active Recognized MRR
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-[#345C64]/80" />
                  Historical Performance
                </span>
              </div>
              <span className="font-mono text-[#2E9F92] font-semibold bg-[#EAF7F5] px-2.5 py-1 rounded-md border border-[#DDF3F0]">
                99.8% Automated Collection Target
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Right: Plan Distribution & Health */}
        <BentoCard
          title="Contract Distribution"
          subtitle="Breakdown by product tier and add-on uptake"
          className="lg:col-span-4"
        >
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Business Software (Odoo Brand Edition)</span>
                <span className="font-mono text-slate-200">54%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[54%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Standard Software Edition</span>
                <span className="font-mono text-slate-200">26%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[26%] h-full bg-cyan-400 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">AI Dunning & Recovery Engine</span>
                <span className="font-mono text-slate-200">14%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[14%] h-full bg-emerald-400 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Concierge SLA Support</span>
                <span className="font-mono text-slate-200">6%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[6%] h-full bg-amber-400 rounded-full" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-200 font-semibold">Scheduled Billing Batch</div>
                  <div className="text-[11px] text-slate-400">All active subscriptions</div>
                </div>
                <button
                  onClick={() => onNavigate('billing')}
                  className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-medium text-[11px] transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Recent Subscriptions & Invoices Table Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Subscriptions Feed */}
        <BentoCard
          title="Active Subscriptions"
          subtitle="Live recurring contracts under management"
          headerAction={
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2.5 font-semibold">Subscription</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold">Amount</th>
                  <th className="pb-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(recentSubscriptions || []).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5">
                      <div className="font-mono text-slate-200 font-medium">{sub.subscriptionNumber}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{sub.planName}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="text-slate-200 font-medium">{sub.customerName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{sub.customerEmail}</div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-200 font-semibold">
                      ${(sub.totalAmount ?? 0).toLocaleString()}
                      <span className="text-[10px] text-slate-400 block font-normal">/{sub.billingInterval}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={sub.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>

        {/* Recent Invoices Feed */}
        <BentoCard
          title="Recent Invoices & Inflows"
          subtitle="Latest billed statements and payment receipts"
          headerAction={
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2.5 font-semibold">Invoice</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold">Total</th>
                  <th className="pb-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(recentInvoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5">
                      <div className="font-mono text-slate-200 font-medium">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">Due {inv.dueDate}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="text-slate-200 font-medium">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.outstandingBalance > 0 ? `Bal: $${inv.outstandingBalance}` : 'Settled'}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-200 font-semibold">
                      ${(inv.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
