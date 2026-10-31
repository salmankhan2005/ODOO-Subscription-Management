import React, { useState, useEffect, useMemo } from 'react';
import { paymentApi, invoiceApi } from '../../api/services';
import { Payment, Invoice, PaymentMethod } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Search } from 'lucide-react';

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

  const summary = useMemo(() => {
    const totalSettled = payments.reduce((acc, p) => acc + p.amount, 0);
    const cardVolume = payments
      .filter((p) => p.method === 'Card')
      .reduce((acc, p) => acc + p.amount, 0);
    const openReceivable = unpaidInvoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0);
    return { totalSettled, cardVolume, openReceivable };
  }, [payments, unpaidInvoices]);

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
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Payment Settlements
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Reconcile incoming funds across Stripe Card capture, ACH wire, UPI instant rails, and manual ledger entries.
          </p>
        </div>

        <button
          onClick={() => {
            setTxnRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Settlement KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BentoCard variant="teal" className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DDF3F0]/85">
            Total Cleared Volume
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1.5">
            ${summary.totalSettled.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#DDF3F0]/80 mt-1">
            {payments.length} verified ledger receipts
          </div>
        </BentoCard>

        <BentoCard className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
            Automated Card Capture
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#2E9F92] mt-1.5">
            ${summary.cardVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#56666B] mt-1">
            Primary gateway settlement rail
          </div>
        </BentoCard>

        <BentoCard className="p-4 md:p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
            Pending Invoice Queue
          </span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1.5 ${
              summary.openReceivable > 0 ? 'text-[#E96F50]' : 'text-[#252B2E]'
            }`}
          >
            ${summary.openReceivable.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#56666B] mt-1">
            {unpaidInvoices.length} open statement{unpaidInvoices.length === 1 ? '' : 's'} awaiting settlement
          </div>
        </BentoCard>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5ECEC]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#56666B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, customer, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
          />
        </div>
        <span className="hidden sm:inline text-[11px] font-mono text-[#56666B]">
          Showing {payments.length} settlement record{payments.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Payments Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-wider text-[#56666B] border-b border-[#E5ECEC]">
              <tr>
                <th className="px-5 py-3 font-semibold">Payment Ref</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Invoice Ref</th>
                <th className="px-4 py-3 font-semibold">Settlement Rail</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Amount Settled</th>
                <th className="px-5 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEC]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#56666B]">
                    No payment records match your search query.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-[#1F3F47]">{p.paymentReference}</div>
                      <div className="text-[11px] text-[#56666B] font-mono truncate max-w-[160px]">
                        {p.transactionReference}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#252B2E]">{p.customerName}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-[#345C64]">
                      {p.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-[#56666B] font-medium">
                      {p.method}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[#56666B]">{p.paymentDate}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-[#2E9F92]">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Apply incoming settlement against an open customer invoice."
        maxWidth="md"
      >
        <form onSubmit={handleRecord} className="space-y-4 text-xs">
          {unpaidInvoices.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] text-center text-[#56666B]">
              All active invoices have been settled in full. Zero open receivables.
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Target Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                >
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} (Due: ${inv.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="p-3.5 rounded-xl bg-[#345C64] text-white flex justify-between items-center text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-[#DDF3F0]/80 text-[11px] block font-sans">Invoice Total</span>
                    <div className="font-semibold text-sm">${selectedInvoice.totalAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#DDF3F0]/80 text-[11px] block font-sans">Outstanding Receivable</span>
                    <div className="text-[#FFBFB0] font-bold text-sm">
                      ${selectedInvoice.outstandingBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#252B2E] mb-1">Settlement Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
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
                  <label className="block font-semibold text-[#252B2E] mb-1">Payment Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={selectedInvoice?.outstandingBalance}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Transaction Reference</label>
                <input
                  type="text"
                  required
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Ledger Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared via Silicon Valley Bank ACH"
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5ECEC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#E5ECEC]/60 text-[#252B2E] font-medium whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors whitespace-nowrap shrink-0"
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
