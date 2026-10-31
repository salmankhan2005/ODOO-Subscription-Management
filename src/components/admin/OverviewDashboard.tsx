import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { reportApi, subscriptionApi, invoiceApi, customerApi } from '../../api/services';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { AnimatedNavIcon } from '../common/AnimatedNavIcon';
import { ArrowUpRight, Zap, Plus } from 'lucide-react';
import { Subscription, Invoice, Customer } from '../../types';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

const REVENUE_SERIES = [
  { month: 'May', realized: 74200, expansion: 6100, realizedHeight: 'h-[72%]', expHeight: 'h-[24%]' },
  { month: 'Jun', realized: 79800, expansion: 7400, realizedHeight: 'h-[78%]', expHeight: 'h-[29%]' },
  { month: 'Jul', realized: 84100, expansion: 8200, realizedHeight: 'h-[83%]', expHeight: 'h-[33%]' },
  { month: 'Aug', realized: 88500, expansion: 9600, realizedHeight: 'h-[88%]', expHeight: 'h-[38%]' },
  { month: 'Sep', realized: 91400, expansion: 10800, realizedHeight: 'h-[92%]', expHeight: 'h-[43%]' },
  { month: 'Oct', realized: 94820, expansion: 12400, realizedHeight: 'h-[97%]', expHeight: 'h-[50%]' }
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState({
    mrr: 94820,
    arr: 1137840,
    activeSubscriptionsCount: 42,
    totalCustomersCount: 18,
    totalCollected: 268400,
    totalOutstanding: 2410,
    overdueCount: 1,
    overdueAmount: 1760,
    upcomingRenewalsCount: 5
  });

  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(5);
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const summaryRes = await reportApi.getFinancialSummary();
      if (summaryRes.success && summaryRes.data) {
        setMetrics(summaryRes.data);
      }
      const subsRes = await subscriptionApi.getAll();
      if (subsRes.success) setRecentSubscriptions(subsRes.data.slice(0, 5));

      const invsRes = await invoiceApi.getAll();
      if (invsRes.success) setRecentInvoices(invsRes.data.slice(0, 5));

      const custRes = await customerApi.getAll();
      if (custRes.success) setCustomers(custRes.data);
    };

    loadData();
  }, []);

  const focusedMonth = REVENUE_SERIES[selectedMonthIdx];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Executive Revenue Overview
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Real-time recurring contract telemetry, statutory collections, and receivable health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('quotations')}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#1F3F47] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#2E9F92] transition-transform duration-150 group-hover:rotate-90" />
            <span>New Quotation</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Zap className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-115 group-hover:-rotate-6" />
            <span>Batch Billing Studio</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Primary Teal (#345C64) Hero Financial KPI Cards with Rolling Counters & Animated Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onMouseEnter={() => setHoveredKpi('mrr')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard variant="teal" onClick={() => onNavigate('reports')} className="p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#DDF3F0] mb-1.5">
              <span>Monthly Recurring (MRR)</span>
              <AnimatedNavIcon
                kind="trending"
                isHovered={hoveredKpi === 'mrr'}
                className="w-4 h-4 text-[#8CE6DB]"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              <AnimatedCounter value={metrics.mrr} prefix="$" />
            </div>
            <div className="text-[11px] text-[#8CE6DB] flex items-center gap-1 mt-1.5 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span>+12.4% vs prior billing cycle</span>
            </div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('arr')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard variant="teal" onClick={() => onNavigate('subscriptions')} className="p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#DDF3F0] mb-1.5">
              <span>Annualized Run-Rate (ARR)</span>
              <AnimatedNavIcon
                kind="subscriptions"
                isHovered={hoveredKpi === 'arr'}
                className="w-4 h-4 text-[#DDF3F0]"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              <AnimatedCounter value={metrics.arr} prefix="$" />
            </div>
            <div className="text-[11px] text-[#DDF3F0]/80 mt-1.5">Committed active subscriptions</div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('settled')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard variant="teal" onClick={() => onNavigate('payments')} className="p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#DDF3F0] mb-1.5">
              <span>Total Settled Revenue</span>
              <AnimatedNavIcon
                kind="payments"
                isHovered={hoveredKpi === 'settled'}
                className="w-4 h-4 text-[#8CE6DB]"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              <AnimatedCounter value={metrics.totalCollected} prefix="$" />
            </div>
            <div className="text-[11px] text-[#8CE6DB] mt-1.5">Reconciled card &amp; ACH wire</div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('subs')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard variant="teal" onClick={() => onNavigate('subscriptions')} className="p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#DDF3F0] mb-1.5">
              <span>Active Subscriptions</span>
              <AnimatedNavIcon
                kind="plans"
                isHovered={hoveredKpi === 'subs'}
                className="w-4 h-4 text-[#DDF3F0]"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              <AnimatedCounter value={metrics.activeSubscriptionsCount} />
            </div>
            <div className="text-[11px] text-[#DDF3F0]/80 mt-1.5">100% scheduled cadence coverage</div>
          </BentoCard>
        </div>
      </div>

      {/* Row 2: 4 Pure White (#FFFFFF) Operational Health KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onMouseEnter={() => setHoveredKpi('customers')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard onClick={() => onNavigate('customers')} className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#56666B] mb-1">
              <span>Enterprise Customers</span>
              <AnimatedNavIcon
                kind="customers"
                isHovered={hoveredKpi === 'customers'}
                className="w-4 h-4 text-[#345C64]"
              />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#252B2E]">
              <AnimatedCounter value={customers.length || metrics.totalCustomersCount} />
            </div>
            <div className="text-[11px] text-[#56666B] mt-1">Multi-seat B2B organizations</div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('receivable')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard onClick={() => onNavigate('invoices')} className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#56666B] mb-1">
              <span>Net 30 Receivable</span>
              <AnimatedNavIcon
                kind="invoices"
                isHovered={hoveredKpi === 'receivable'}
                className="w-4 h-4 text-[#345C64]"
              />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#252B2E]">
              <AnimatedCounter value={metrics.totalOutstanding} prefix="$" />
            </div>
            <div className="text-[11px] text-[#56666B] mt-1">Open within standard terms</div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('overdue')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard onClick={() => onNavigate('billing')} className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#56666B] mb-1">
              <span>Overdue In Dunning</span>
              <AnimatedNavIcon
                kind="alert"
                isHovered={hoveredKpi === 'overdue'}
                className="w-4 h-4 text-[#E96F50]"
              />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#E96F50]">
              <AnimatedCounter value={metrics.overdueAmount} prefix="$" />
            </div>
            <div className="text-[11px] text-[#C85234] font-medium mt-1">
              {metrics.overdueCount} account in smart retry
            </div>
          </BentoCard>
        </div>

        <div
          onMouseEnter={() => setHoveredKpi('renewals')}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <BentoCard onClick={() => onNavigate('subscriptions')} className="p-4 sm:p-5 h-full">
            <div className="flex items-center justify-between text-xs text-[#56666B] mb-1">
              <span>Upcoming Renewals</span>
              <AnimatedNavIcon
                kind="clock"
                isHovered={hoveredKpi === 'renewals'}
                className="w-4 h-4 text-[#2E9F92]"
              />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#2E9F92]">
              <AnimatedCounter value={metrics.upcomingRenewalsCount} />
            </div>
            <div className="text-[11px] text-[#56666B] mt-1">Next 14 business days</div>
          </BentoCard>
        </div>
      </div>

      {/* Middle Analytical Grid: Dual-Bar Chart (#2E9F92 & #E96F50) + Contract Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Revenue Realization & Seat Expansion"
          subtitle="Select any month to inspect realized base collections vs variant & add-on expansion"
          headerAction={
            <div className="text-right font-mono tabular-nums text-xs">
              <span className="text-[#56666B]">{focusedMonth.month} 2026: </span>
              <span className="font-bold text-[#1F3F47]">${focusedMonth.realized.toLocaleString()}</span>
              <span className="text-[#E96F50] ml-2 font-semibold">
                +${focusedMonth.expansion.toLocaleString()}
              </span>
            </div>
          }
          className="lg:col-span-8"
        >
          <div className="mt-2 space-y-5">
            <div className="grid grid-cols-6 gap-3 text-center text-xs pt-2">
              {REVENUE_SERIES.map((bar, idx) => {
                const isSelected = selectedMonthIdx === idx;
                return (
                  <button
                    key={bar.month}
                    type="button"
                    onClick={() => setSelectedMonthIdx(idx)}
                    className="relative group flex flex-col items-center p-2 rounded-xl transition-colors"
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="overview-month-highlight"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-xl bg-[#DDF3F0]/60"
                      />
                    )}
                    <div className="relative z-10 text-[11px] font-mono tabular-nums font-semibold text-[#252B2E] mb-2">
                      ${(bar.realized / 1000).toFixed(1)}k
                    </div>
                    <div className="relative z-10 w-full max-w-[52px] h-36 bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-1.5 flex items-end justify-center gap-1.5">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-1/2 rounded-t bg-[#2E9F92] origin-bottom ${bar.realizedHeight}`}
                        title={`Realized MRR: $${bar.realized.toLocaleString()}`}
                      />
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: 0.35,
                          delay: idx * 0.04 + 0.06,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className={`w-1/2 rounded-t bg-[#E96F50] origin-bottom ${bar.expHeight}`}
                        title={`Variant Expansion: $${bar.expansion.toLocaleString()}`}
                      />
                    </div>
                    <div
                      className={`relative z-10 text-xs mt-2 ${
                        isSelected ? 'text-[#1F3F47] font-bold' : 'text-[#56666B] font-medium'
                      }`}
                    >
                      {bar.month}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E5ECEC] flex flex-wrap items-center justify-between text-xs text-[#56666B] gap-2">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#2E9F92]" />
                  <span className="text-[#252B2E] font-medium">Realized Recurring MRR</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#E96F50]" />
                  <span className="text-[#252B2E] font-medium">Variant &amp; Add-On Expansion</span>
                </span>
              </div>
              <span className="font-mono text-[#1E7A70] font-semibold">99.2% Automated Settlement</span>
            </div>
          </div>
        </BentoCard>

        {/* Right: Contract Distribution */}
        <BentoCard
          title="Revenue Mix by Product Edition"
          subtitle="Share of recurring billing volume"
          className="lg:col-span-4 flex flex-col justify-between"
        >
          <div className="space-y-4 mt-1">
            {[
              { label: 'Odoo Brand Edition (+$560)', pct: 54, widthClass: 'w-[54%]', color: 'bg-[#2E9F92]' },
              { label: 'Standard Software Core', pct: 26, widthClass: 'w-[26%]', color: 'bg-[#345C64]' },
              { label: 'Smart Dunning Add-On', pct: 14, widthClass: 'w-[14%]', color: 'bg-[#E96F50]' },
              { label: 'Dedicated Concierge SLA', pct: 6, widthClass: 'w-[6%]', color: 'bg-[#1F3F47]' }
            ].map((row, idx) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#252B2E] font-medium">{row.label}</span>
                  <span className="font-mono tabular-nums font-bold text-[#1F3F47]">{row.pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#F7FAFA] border border-[#E5ECEC] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full origin-left ${row.widthClass} ${row.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-5 border-t border-[#E5ECEC]">
            <div className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between text-xs">
              <div>
                <div className="text-[#252B2E] font-semibold">Next Batch Execution</div>
                <div className="text-[11px] text-[#56666B]">Evaluates all due recurring contracts</div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('billing')}
                className="px-3 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                Open Studio
              </button>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Bottom Data Tables: Active Subscriptions & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BentoCard
          title="Active Subscriptions"
          subtitle="Live recurring contracts under management"
          headerAction={
            <button
              type="button"
              onClick={() => onNavigate('subscriptions')}
              className="group/link text-xs text-[#1F3F47] hover:text-[#2E9F92] font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-[#56666B] border-b border-[#E5ECEC]">
                <tr>
                  <th className="pb-2.5 font-semibold">Subscription</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold text-right">Amount</th>
                  <th className="pb-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {recentSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="py-2.5">
                      <div className="font-mono text-[#1F3F47] font-semibold">{sub.subscriptionNumber}</div>
                      <div className="text-[11px] text-[#56666B] truncate max-w-[160px]">{sub.planName}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="text-[#252B2E] font-medium">{sub.customerName}</div>
                      <div className="text-[11px] text-[#56666B] font-mono truncate max-w-[140px]">
                        {sub.customerEmail}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#252B2E] font-semibold">
                      ${sub.totalAmount.toLocaleString()}
                      <span className="text-[10px] text-[#56666B] block font-normal">/{sub.billingInterval}</span>
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

        <BentoCard
          title="Recent Statutory Invoices"
          subtitle="Latest billed statements and settlement balances"
          headerAction={
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="group/link text-xs text-[#1F3F47] hover:text-[#2E9F92] font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-[#56666B] border-b border-[#E5ECEC]">
                <tr>
                  <th className="pb-2.5 font-semibold">Invoice</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold text-right">Total</th>
                  <th className="pb-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="py-2.5">
                      <div className="font-mono text-[#1F3F47] font-semibold">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-[#56666B] font-mono tabular-nums">Due {inv.dueDate}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="text-[#252B2E] font-medium">{inv.customerName}</div>
                      <div className="text-[11px] text-[#56666B] font-mono tabular-nums">
                        {inv.outstandingBalance > 0
                          ? `Bal: $${inv.outstandingBalance.toLocaleString()}`
                          : 'Settled'}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#252B2E] font-semibold">
                      ${inv.totalAmount.toLocaleString()}
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
