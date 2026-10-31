import React, { useState, useEffect } from 'react';
import { paymentApi, invoiceApi } from '../../api/services';
import { Payment, Invoice, PaymentMethod } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Plus, Search, CheckCircle2, Download } from 'lucide-react';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Card');
  const [amount, setAmount] = useState<number>(0);
  const [txnRef, setTxnRef] = useState('');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    const pRes = await paymentApi.getAll();
    if (pRes.success) {
      let data = pRes.data;
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (p) =>
            p.paymentReference.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.invoiceNumber.toLowerCase().includes(q)
        );
      }
      setPayments(data);
    }

    const invRes = await invoiceApi.getAll();
    if (invRes.success) {
      const open = invRes.data.filter((i) => i.outstandingBalance > 0);
      setUnpaidInvoices(open);
      if (open.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(open[0].id);
        setAmount(open[0].outstandingBalance);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const selectedInvoice = unpaidInvoices.find((i) => i.id === selectedInvoiceId);

  const handleInvoiceSelect = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = unpaidInvoices.find((i) => i.id === id);
    if (inv) {
      setAmount(inv.outstandingBalance);
    }
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || amount <= 0) {
      showToast('Please select an invoice and enter a valid amount', { type: 'error' });
      return;
    }

    const res = await paymentApi.record({
      invoiceId: selectedInvoiceId,
      method,
      amount,
      transactionReference: txnRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes
    });

    if (res.success) {
      showToast(res.message || 'Payment logged successfully');
      setIsModalOpen(false);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Payment Transactions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile incoming funds across Stripe Card capture, ACH wire, UPI, and manual ledger settlements.
          </p>
        </div>

        <button
          onClick={() => {
            setTxnRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, customer, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Payment Ref</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Invoice Ref</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Amount Settled</th>
                <th className="px-5 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-semibold text-slate-200">{p.paymentReference}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                      {p.transactionReference}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-200">{p.customerName}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-indigo-400">
                    {p.invoiceNumber}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{p.paymentDate}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-400">
                    ${p.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Apply settlement against an outstanding invoice."
        maxWidth="md"
      >
        <form onSubmit={handleRecord} className="space-y-4 text-xs">
          {unpaidInvoices.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              All active invoices have been fully settled! No open balances.
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} (Bal: ${inv.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Total Invoice Amount:</span>
                    <div className="font-mono text-slate-200">${selectedInvoice.totalAmount}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Outstanding Receivable:</span>
                    <div className="font-mono text-rose-400 font-bold">${selectedInvoice.outstandingBalance}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer / Wire</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={selectedInvoice?.outstandingBalance}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  required
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Ledger Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared via Silicon Valley Bank ACH"
                  className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Confirm & Settle
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};
