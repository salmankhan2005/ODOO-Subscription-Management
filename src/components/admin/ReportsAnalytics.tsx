import React, { useState, useEffect } from 'react';
import { subscriptionApi, invoiceApi, customerApi } from '../../api/services';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Download, Printer } from 'lucide-react';
import { Invoice, Subscription, Customer } from '../../types';

export const ReportsAnalytics: React.FC = () => {
  const [activeReport, setActiveReport] = useState<
    'revenue' | 'subscriptions' | 'overdue' | 'customers'
  >('revenue');

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

      const custRes = await customerApi.getAll();
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
    const filename = `brightloop_report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'overdue') {
      rows = [
        'Invoice,Customer,Due Date,Total,Outstanding,Status\n',
        ...overdueInvoices.map(
          (i) =>
            `"${i.invoiceNumber}","${i.customerName}","${i.dueDate}",${i.totalAmount},${i.outstandingBalance},"${i.status}"\n`
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
    showToast(`Exported ${activeReport.toUpperCase()} ledger report as CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Executive Revenue Reports
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Month-end audit aggregates across recognized collections, active cadences, and overdue receivables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-[#345C64]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportCurrentReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#E5ECEC] w-fit overflow-x-auto max-w-full">
        {[
          { id: 'revenue', label: 'Revenue Performance' },
          { id: 'subscriptions', label: 'Subscription Health' },
          { id: 'overdue', label: 'Overdue Collections' },
          { id: 'customers', label: 'Customer Balances' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-4 py-2 text-xs rounded-lg transition-colors font-semibold whitespace-nowrap shrink-0 ${
              activeReport === tab.id
                ? 'bg-[#1F3F47] text-white'
                : 'text-[#56666B] hover:text-[#252B2E] hover:bg-[#F7FAFA]'
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
            <BentoCard variant="teal" className="p-5">
              <span className="text-xs text-[#DDF3F0]">Total Reconciled Collections</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
                ${totalCollected.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8CE6DB] mt-1">Direct settled receipts</div>
            </BentoCard>

            <BentoCard className="p-5">
              <span className="text-xs text-[#56666B]">Outstanding Receivable Balance</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#252B2E] mt-1">
                ${totalOutstanding.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#56666B] mt-1">Within Net 30 credit terms</div>
            </BentoCard>

            <BentoCard className="p-5">
              <span className="text-xs text-[#56666B]">Overdue Invoices at Risk</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#E96F50] mt-1">
                ${overdueTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#C85234] font-medium mt-1">
                {overdueInvoices.length} account in dunning retry
              </div>
            </BentoCard>
          </div>

          <BentoCard title="Audited Inflows by Settlement Rail" subtitle="Distribution across payment processors">
            <div className="space-y-3 mt-1 text-xs">
              {[
                { name: 'Stripe Corporate Credit & Debit Cards', amount: '$192,400', share: 72, bar: 'bg-[#2E9F92]' },
                { name: 'ACH & Domestic Bank Wire Transfers', amount: '$54,800', share: 20, bar: 'bg-[#345C64]' },
                { name: 'UPI & Alternate Instant Rails', amount: '$21,200', share: 8, bar: 'bg-[#E96F50]' }
              ].map((rail) => (
                <div
                  key={rail.name}
                  className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[#252B2E] font-semibold">{rail.name}</span>
                    <span className="font-mono text-[#1F3F47] font-bold">
                      {rail.amount} ({rail.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white border border-[#E5ECEC] rounded-full overflow-hidden">
                    <div style={{ width: `${rail.share}%` }} className={`h-full ${rail.bar} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      )}

      {/* Report Tab 2: Subscription Health */}
      {activeReport === 'subscriptions' && (
        <BentoCard title="Active Subscriptions by Cadence" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Subscription</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Interval</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Cadence Total</th>
                  <th className="px-5 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FAFA]">
                    <td className="px-5 py-3 font-mono font-semibold text-[#1F3F47]">{s.subscriptionNumber}</td>
                    <td className="px-4 py-3 text-[#252B2E] font-medium">{s.customerName}</td>
                    <td className="px-4 py-3 capitalize text-[#56666B]">{s.billingInterval}</td>
                    <td className="px-4 py-3 font-mono text-[#56666B]">{s.startDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#252B2E]">
                      ${s.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}

      {/* Report Tab 3: Overdue Invoices */}
      {activeReport === 'overdue' && (
        <BentoCard
          title="Overdue Invoices Action Queue"
          subtitle="Prioritized chase list preventing delinquent revenue leakage"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                <tr>
                  <th className="p-3 font-semibold">Invoice</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Due Date</th>
                  <th className="p-3 font-semibold text-right">Total</th>
                  <th className="p-3 font-semibold text-right">Outstanding</th>
                  <th className="p-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {overdueInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#56666B]">
                      Zero overdue invoices. All customer accounts are current.
                    </td>
                  </tr>
                ) : (
                  overdueInvoices.map((i) => (
                    <tr key={i.id} className="hover:bg-[#F7FAFA]">
                      <td className="p-3 font-mono font-bold text-[#E96F50]">{i.invoiceNumber}</td>
                      <td className="p-3 text-[#252B2E] font-medium">
                        {i.customerName}
                        <span className="block text-[11px] text-[#56666B] font-mono">{i.customerEmail}</span>
                      </td>
                      <td className="p-3 font-mono text-[#56666B]">{i.dueDate}</td>
                      <td className="p-3 text-right font-mono text-[#252B2E]">
                        ${i.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#E96F50]">
                        ${i.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}

      {/* Report Tab 4: Customer Balances */}
      {activeReport === 'customers' && (
        <BentoCard title="Accounts Receivable Ledger by Enterprise">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                <tr>
                  <th className="p-3 font-semibold">Customer &amp; Company</th>
                  <th className="p-3 font-semibold">Country</th>
                  <th className="p-3 font-semibold text-center">Active Subs</th>
                  <th className="p-3 font-semibold text-right">Total Recognized</th>
                  <th className="p-3 font-semibold text-right">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7FAFA]">
                    <td className="p-3">
                      <div className="font-semibold text-[#252B2E]">{c.name}</div>
                      <div className="text-[11px] text-[#56666B]">{c.company}</div>
                    </td>
                    <td className="p-3 text-[#56666B]">{c.country}</td>
                    <td className="p-3 text-center font-mono text-[#1F3F47] font-bold">
                      {c.activeSubscriptionsCount}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#2E9F92]">
                      ${c.totalRevenue.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={c.outstandingBalance > 0 ? 'text-[#E96F50]' : 'text-[#56666B]'}>
                        ${c.outstandingBalance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      )}
    </div>
  );
};
