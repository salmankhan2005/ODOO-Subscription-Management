import React, { useState, useEffect, useMemo } from 'react';
import { invoiceApi, paymentApi } from '../../api/services';
import { Invoice, PaymentMethod } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Eye,
  Send,
  Printer,
  CreditCard
} from 'lucide-react';

export const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Record payment modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Card');
  const [payRef, setPayRef] = useState('');

  const { showToast } = useToast();

  const loadInvoices = async () => {
    const res = await invoiceApi.getAll(statusFilter);
    if (res.success) {
      let data = res.data;
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (i) =>
            i.invoiceNumber.toLowerCase().includes(q) ||
            i.customerName.toLowerCase().includes(q) ||
            (i.subscriptionNumber && i.subscriptionNumber.toLowerCase().includes(q))
        );
      }
      setInvoices(data);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, search]);

  const metrics = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalSettled = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;
    return { totalBilled, totalSettled, totalOutstanding, overdueCount };
  }, [invoices]);

  const handleSendInvoice = async (inv: Invoice) => {
    const res = await invoiceApi.sendInvoice(inv.id);
    if (res.success) {
      showToast(`Invoice ${inv.invoiceNumber} emailed to ${inv.customerEmail}`);
      loadInvoices();
      if (viewingInvoice && viewingInvoice.id === inv.id) {
        setViewingInvoice(res.data);
      }
    }
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setPaymentModalInvoice(inv);
    setPayAmount(inv.outstandingBalance);
    setPayRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    if (payAmount <= 0) {
      showToast('Payment amount must be greater than zero', { type: 'error' });
      return;
    }
    if (payAmount > paymentModalInvoice.outstandingBalance) {
      showToast('Payment amount cannot exceed outstanding balance', { type: 'warning' });
      return;
    }

    const res = await paymentApi.record({
      invoiceId: paymentModalInvoice.id,
      method: payMethod,
      amount: payAmount,
      transactionReference: payRef,
      notes: 'Captured via Brightloop payment terminal'
    });

    if (res.success) {
      showToast(res.message || 'Payment recorded successfully');
      setPaymentModalInvoice(null);
      loadInvoices();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Invoice Ledger & Statements
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Automated recurring invoices, statutory tax calculation, customer dispatch logs, and receivable balances.
          </p>
        </div>
      </div>

      {/* Executive Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BentoCard variant="teal" className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DDF3F0]/85">
            Filtered Billed Volume
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1.5">
            ${metrics.totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#DDF3F0]/80 mt-1">
            Across {invoices.length} electronic statements
          </div>
        </BentoCard>

        <BentoCard className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
            Settled Collections
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#2E9F92] mt-1.5">
            ${metrics.totalSettled.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#56666B] mt-1">
            Cleared via card, ACH wire, and UPI rails
          </div>
        </BentoCard>

        <BentoCard className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
            Open Receivables
          </span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1.5 ${
              metrics.totalOutstanding > 0 ? 'text-[#E96F50]' : 'text-[#252B2E]'
            }`}
          >
            ${metrics.totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#56666B] mt-1">
            {metrics.overdueCount > 0
              ? `${metrics.overdueCount} statement${metrics.overdueCount > 1 ? 's' : ''} past due date`
              : 'Zero statements past due'}
          </div>
        </BentoCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E5ECEC]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#56666B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number, customer, contract..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'paid', 'partially_paid', 'overdue', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs capitalize rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-[#1F3F47] text-white font-semibold'
                  : 'text-[#56666B] hover:text-[#252B2E] hover:bg-[#F7FAFA]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-wider text-[#56666B] border-b border-[#E5ECEC]">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Subscription Ref</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold text-right">Invoice Total</th>
                <th className="px-4 py-3 font-semibold text-right">Outstanding</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEC]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#56666B]">
                    No invoices match the current filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-[#1F3F47]">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-[#56666B] font-mono tabular-nums">
                        Issued {inv.invoiceDate}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#252B2E]">{inv.customerName}</div>
                      <div className="text-[11px] text-[#56666B] font-mono">{inv.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#345C64]">
                      {inv.subscriptionNumber || 'Ad-Hoc Order'}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[#56666B]">{inv.dueDate}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-[#252B2E]">
                      ${inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold">
                      <span className={inv.outstandingBalance > 0 ? 'text-[#E96F50]' : 'text-[#56666B]'}>
                        ${inv.outstandingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded-lg text-[#56666B] hover:text-[#1F3F47] hover:bg-[#DDF3F0]/60 transition-colors"
                          title="View Printable Statement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleSendInvoice(inv)}
                          className="p-1.5 rounded-lg text-[#56666B] hover:text-[#345C64] hover:bg-[#DDF3F0]/60 transition-colors"
                          title="Dispatch Statement via Email"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {inv.outstandingBalance > 0 && (
                          <button
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="p-1.5 rounded-lg text-[#56666B] hover:text-[#2E9F92] hover:bg-[#DDF3F0]/60 transition-colors"
                            title="Record Settlement"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Invoice Document Modal */}
      {viewingInvoice && (
        <Modal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          title={`Statement ${viewingInvoice.invoiceNumber}`}
          subtitle={`Billed to ${viewingInvoice.customerName}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5ECEC]">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={viewingInvoice.status} />
                {viewingInvoice.sentDate && (
                  <span className="text-[11px] text-[#56666B] font-mono tabular-nums">
                    · Dispatched {viewingInvoice.sentDate}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#DDF3F0]/50 text-[#252B2E] font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-[#345C64]" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => handleSendInvoice(viewingInvoice)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Email PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 md:p-8 rounded-xl bg-white border border-[#E5ECEC] space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-[#E5ECEC]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#1F3F47] flex items-center justify-center font-bold text-xs text-white">
                      B
                    </div>
                    <span className="font-bold text-base text-[#252B2E] tracking-tight font-display">
                      Brightloop Software Corp.
                    </span>
                  </div>
                  <p className="text-[#56666B] text-[11px]">100 Enterprise Way, Suite 400</p>
                  <p className="text-[#56666B] text-[11px]">San Francisco, CA 94107 · billing@brightloop.io</p>
                  <p className="text-[#56666B] text-[11px] font-mono">Tax ID: US-EIN-94820194</p>
                </div>

                <div className="sm:text-right space-y-1">
                  <h2 className="text-xl font-bold font-mono tracking-tight text-[#1F3F47]">TAX INVOICE</h2>
                  <div className="text-sm font-mono text-[#345C64] font-semibold">
                    {viewingInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-[#56666B] font-mono tabular-nums">
                    Issue Date: {viewingInvoice.invoiceDate}
                  </div>
                  <div className="text-[11px] text-[#56666B] font-mono tabular-nums">
                    Payment Due: {viewingInvoice.dueDate}
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#56666B] block mb-1">
                    Bill To
                  </span>
                  <div className="font-semibold text-[#252B2E] text-sm">{viewingInvoice.customerName}</div>
                  <div className="text-[#56666B] font-mono text-[11px] mt-0.5">{viewingInvoice.customerEmail}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#56666B] block mb-1">
                    Contract Reference
                  </span>
                  <div className="font-mono font-semibold text-[#1F3F47] text-sm">
                    {viewingInvoice.subscriptionNumber || 'One-Time Enterprise Order'}
                  </div>
                  <div className="text-[#56666B] text-[11px] mt-0.5">Automated recurring billing schedule</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-[#E5ECEC] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] uppercase tracking-wider border-b border-[#E5ECEC]">
                    <tr>
                      <th className="p-3 font-semibold">Description</th>
                      <th className="p-3 text-center font-semibold">Qty</th>
                      <th className="p-3 text-right font-semibold">Unit Price</th>
                      <th className="p-3 text-right font-semibold">Tax (18%)</th>
                      <th className="p-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECEC]">
                    {viewingInvoice.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3">
                          <div className="font-semibold text-[#252B2E]">{l.productName}</div>
                          {l.variantName && (
                            <div className="text-[11px] text-[#345C64] mt-0.5">{l.variantName}</div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums text-[#252B2E]">{l.quantity}</td>
                        <td className="p-3 text-right font-mono tabular-nums text-[#56666B]">${l.unitPrice}</td>
                        <td className="p-3 text-right font-mono tabular-nums text-[#56666B]">
                          ${l.taxAmount.toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-semibold text-[#252B2E]">
                          ${l.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 p-4 rounded-xl bg-[#345C64] text-white space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between text-[#DDF3F0]/85">
                    <span>Subtotal</span>
                    <span>${viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#DDF3F0]/85">
                    <span>Statutory Tax (18%)</span>
                    <span>${viewingInvoice.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/15">
                    <span>Total Billed</span>
                    <span>${viewingInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#8CE6DB]">
                    <span>Amount Settled</span>
                    <span>-${viewingInvoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div
                    className={`flex justify-between font-bold pt-1.5 border-t border-white/15 ${
                      viewingInvoice.outstandingBalance > 0 ? 'text-[#FFBFB0]' : 'text-[#DDF3F0]'
                    }`}
                  >
                    <span>Balance Due</span>
                    <span>${viewingInvoice.outstandingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <Modal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          title="Record Payment Receipt"
          subtitle={`Invoice ${paymentModalInvoice.invoiceNumber} · ${paymentModalInvoice.customerName}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#345C64] text-white space-y-1.5 font-mono tabular-nums">
              <div className="flex justify-between text-[#DDF3F0]/85">
                <span>Invoice Total</span>
                <span>${paymentModalInvoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#8CE6DB]">
                <span>Already Settled</span>
                <span>${paymentModalInvoice.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1.5 border-t border-white/15">
                <span>Outstanding Balance</span>
                <span>${paymentModalInvoice.outstandingBalance.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Payment Method *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">ACH / Bank Wire Transfer</option>
                <option value="UPI">UPI Instant Rails</option>
                <option value="Cash">Cash Ledger</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={paymentModalInvoice.outstandingBalance}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
              <span className="text-[11px] text-[#56666B] mt-1 block">
                Supports partial settlements up to ${paymentModalInvoice.outstandingBalance.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Transaction Reference</label>
              <input
                type="text"
                required
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5ECEC]">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#E5ECEC]/60 text-[#252B2E] font-medium whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Record Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
