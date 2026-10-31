import React, { useState, useEffect } from 'react';
import { reportApi, subscriptionApi, invoiceApi, customerApi } from '../../api/services';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Clock,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Invoice, Subscription, Customer } from '../../types';

export const ReportsAnalytics: React.FC = () => {
  const [activeReport, setActiveReport] = useState<
    'revenue' | 'subscriptions' | 'overdue' | 'customers'
  >('revenue');

  const [dateRange, setDateRange] = useState('q4_2026');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const invRes = await invoiceApi.getAll();
      if (invRes.success) setInvoices(invRes.data);

      const subRes = await subscriptionApi.getAll();
      if (subRes.success) setSubscriptions(subRes.data);

      const custRes = await customerApi.getAll({ per_page: 100 });
      if (custRes.success) setCustomers(custRes.data);
    };
    load();
  }, []);

  const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.outstandingBalance, 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const overdueTotal = overdueInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);

  const exportCurrentReport = () => {
    let rows: string[] = [];
    let filename = `brightloop_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'overdue') {
      rows = [
        'Invoice,Customer,Due Date,Total,Outstanding,Status\n',
        ...overdueInvoices.map(
          (i) => `"${i.invoiceNumber}","${i.customerName}","${i.dueDate}",${i.totalAmount},${i.outstandingBalance},"${i.status}"\n`
        )
      ];
    } else {
      rows = [
        'Metric,Value\n',
        `"Total Collections",${totalCollected}\n`,
        `"Total Outstanding",${totalOutstanding}\n`,
        `"Overdue Volume",${overdueTotal}\n`,
        `"Active Subscriptions Count",${subscriptions.filter((s) => s.status === 'active').length}\n`
      ];
    }

    const blob = new Blob(rows, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showToast(`Exported ${activeReport.toUpperCase()} report as CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Finance Lead Executive Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sub-second month-end aggregates answering active subscriptions, recognized revenue, and overdue recovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Query Latency Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Telemetry Response: 142ms</span>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportCurrentReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'revenue', label: 'Revenue Performance' },
          { id: 'subscriptions', label: 'Subscription Health' },
          { id: 'overdue', label: 'Overdue Collections' },
          { id: 'customers', label: 'Customer Balances' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2 text-xs rounded-lg transition-colors font-medium ${
              activeReport === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Tab 1: Revenue Performance */}
      {activeReport === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BentoCard glow className="p-5">
              <span className="text-xs text-slate-400">Total Collected Collections</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                ${totalCollected.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Direct reconciled receipts</div>
            </BentoCard>

            <BentoCard glow className="p-5">
              <span className="text-xs text-slate-400">Outstanding Receivable Balance</span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                ${totalOutstanding.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Within standard credit terms</div>
            </BentoCard>

            <BentoCard glow className="p-5">
              <span className="text-xs text-slate-400">Overdue Invoices at Risk</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                ${overdueTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-1">{overdueInvoices.length} account requiring dunning</div>
            </BentoCard>
          </div>

          <BentoCard title="Audited Inflows by Payment Rail">
            <div className="space-y-3 mt-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-200 font-medium">Stripe Credit & Debit Cards</span>
                <span className="font-mono text-emerald-400 font-semibold">$192,400 (71.7%)</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-200 font-medium">ACH / Bank Wire Transfers</span>
                <span className="font-mono text-emerald-400 font-semibold">$54,800 (20.4%)</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-200 font-medium">UPI & Alternate Rails</span>
                <span className="font-mono text-emerald-400 font-semibold">$21,200 (7.9%)</span>
              </div>
            </div>
          </BentoCard>
        </div>
      )}

      {/* Report Tab 2: Subscription Health */}
      {activeReport === 'subscriptions' && (
        <div className="space-y-4">
          <BentoCard title="Active Subscriptions by Cadence">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Subscription</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Interval</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3 text-right">Cadence Total</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-medium text-slate-200">{s.subscriptionNumber}</td>
                      <td className="p-3 text-slate-200">{s.customerName}</td>
                      <td className="p-3 capitalize text-slate-400">{s.billingInterval}</td>
                      <td className="p-3 font-mono text-slate-400">{s.startDate}</td>
                      <td className="p-3 text-right font-mono font-semibold text-white">
                        ${s.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      )}

      {/* Report Tab 3: Overdue Invoices */}
      {activeReport === 'overdue' && (
        <div className="space-y-4">
          <BentoCard
            title="Overdue Invoices Action Queue"
            subtitle="Prioritized chase list preventing delinquent revenue leakage"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Outstanding</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {overdueInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500">
                        Zero overdue invoices. All customer accounts current!
                      </td>
                    </tr>
                  ) : (
                    overdueInvoices.map((i) => (
                      <tr key={i.id}>
                        <td className="p-3 font-mono font-semibold text-rose-400">{i.invoiceNumber}</td>
                        <td className="p-3 text-slate-200">
                          {i.customerName}
                          <span className="block text-[11px] text-slate-400 font-mono">{i.customerEmail}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{i.dueDate}</td>
                        <td className="p-3 text-right font-mono">${i.totalAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">
                          ${i.outstandingBalance.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={i.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      )}

      {/* Report Tab 4: Customer Balances */}
      {activeReport === 'customers' && (
        <div className="space-y-4">
          <BentoCard title="Accounts Receivable Ledger by Enterprise">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Customer & Company</th>
                    <th className="p-3">Country</th>
                    <th className="p-3 text-center">Active Subs</th>
                    <th className="p-3 text-right">Total Recognized</th>
                    <th className="p-3 text-right">Outstanding Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.company}</div>
                      </td>
                      <td className="p-3 text-slate-300">{c.country}</td>
                      <td className="p-3 text-center font-mono text-indigo-400 font-semibold">
                        {c.activeSubscriptionsCount}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                        ${c.totalRevenue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        <span className={c.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                          ${c.outstandingBalance.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      )}
    </div>
  );
};
