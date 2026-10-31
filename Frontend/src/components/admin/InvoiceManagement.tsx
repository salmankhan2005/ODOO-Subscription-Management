import React, { useState, useEffect } from 'react';
import { invoiceApi, paymentApi } from '../../api/services';
import { Invoice, PaymentMethod } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Receipt,
  Search,
  Eye,
  Send,
  Printer,
  CreditCard,
  Download,
  Building,
  CheckCircle2
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
    const res = await invoiceApi.getAll(
      statusFilter === 'all' ? undefined : { status: statusFilter }
    );
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

  const handleSendInvoice = async (inv: Invoice) => {
    const res = await invoiceApi.send(inv.id);
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
      invoice_id: paymentModalInvoice.id,
      payment_method: payMethod,
      amount: payAmount,
      transaction_reference: payRef,
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
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Invoice Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated recurring invoices, statutory taxes, dispatch logs, and collection status.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'paid', 'partially_paid', 'overdue', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs capitalize rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
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
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-slate-200">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">Date: {inv.invoiceDate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {inv.subscriptionNumber || 'Ad-Hoc Order'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{inv.dueDate}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                      ${(inv.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">
                      <span className={inv.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                        ${inv.outstandingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          title="View Printable Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleSendInvoice(inv)}
                          className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Email Invoice to Customer"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {inv.outstandingBalance > 0 && (
                          <button
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Record Payment"
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
          subtitle={`Customer: ${viewingInvoice.customerName}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs p-2">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewingInvoice.status} />
                {viewingInvoice.sentDate && (
                  <span className="text-[11px] text-slate-400 font-mono">Dispatched on {viewingInvoice.sentDate}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => handleSendInvoice(viewingInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Email PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 rounded-2xl bg-[#F7FAFA] border border-slate-800 space-y-6">
              {/* Top Banner */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                      B
                    </div>
                    <span className="font-bold text-base text-white tracking-tight">Brightloop Software Corp.</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">100 Enterprise Way, Suite 400</p>
                  <p className="text-slate-400 text-[11px]">San Francisco, CA 94107 · billing@brightloop.io</p>
                  <p className="text-slate-400 text-[11px] font-mono">Tax ID: US-EIN-94820194</p>
                </div>

                <div className="text-right space-y-1">
                  <h2 className="text-xl font-bold font-mono text-white">INVOICE</h2>
                  <div className="text-sm font-mono text-indigo-400 font-semibold">{viewingInvoice.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Invoice Date: {viewingInvoice.invoiceDate}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Payment Due: {viewingInvoice.dueDate}</div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Bill To:
                  </span>
                  <div className="font-semibold text-slate-100">{viewingInvoice.customerName}</div>
                  <div className="text-slate-300">{viewingInvoice.customerEmail}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Contract Reference:
                  </span>
                  <div className="font-mono text-slate-200">
                    {viewingInvoice.subscriptionNumber || 'One-Time Order'}
                  </div>
                  <div className="text-slate-400 text-[11px]">Automated recurring billing schedule</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Tax (18%)</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(viewingInvoice?.lines || []).map((l) => (
                      <tr key={l.id}>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{l.productName}</div>
                          {l.variantName && <div className="text-[11px] text-indigo-400">{l.variantName}</div>}
                        </td>
                        <td className="p-3 text-center font-mono">{l.quantity}</td>
                        <td className="p-3 text-right font-mono">${l.unitPrice}</td>
                        <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-semibold">${l.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>${viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Statutory Tax (18%):</span>
                    <span>${viewingInvoice.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Amount:</span>
                    <span>${viewingInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Amount Paid:</span>
                    <span>-${viewingInvoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                    <span>Outstanding Due:</span>
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
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Invoice Total:</span>
                <span className="font-mono text-slate-200">${paymentModalInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Already Settled:</span>
                <span className="font-mono text-emerald-400">${paymentModalInvoice.amountPaid}</span>
              </div>
              <div className="flex justify-between text-amber-300 font-semibold pt-1 border-t border-slate-800">
                <span>Outstanding Balance:</span>
                <span className="font-mono">${paymentModalInvoice.outstandingBalance}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
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
              <label className="block font-semibold text-slate-300 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={paymentModalInvoice.outstandingBalance}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Supports partial payments up to ${paymentModalInvoice.outstandingBalance}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Transaction Reference</label>
              <input
                type="text"
                required
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30"
              >
                Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
