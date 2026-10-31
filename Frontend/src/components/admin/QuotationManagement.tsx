import React, { useState, useEffect } from 'react';
import { quotationApi, customerApi, productApi, planApi } from '../../api/services';
import { Quotation, Customer, Product, SubscriptionPlan, LineItem } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Repeat,
  Trash2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);

  const { showToast } = useToast();

  // Wizard state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [quoteLines, setQuoteLines] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');

  const loadAll = async () => {
    const qRes = await quotationApi.getAll();
    if (qRes.success) setQuotations(qRes.data);

    const cRes = await customerApi.getAll();
    if (cRes.success) {
      setCustomers(cRes.data);
      if (cRes.data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(cRes.data[0].id);
      }
    }

    const pRes = await productApi.getAll();
    if (pRes.success) setProducts(pRes.data);

    const plRes = await planApi.getAll();
    if (plRes.success) {
      setPlans(plRes.data);
      if (plRes.data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plRes.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openNewWizard = () => {
    setWizardStep(1);
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct?.variants?.[1] || defaultProduct?.variants?.[0]; // Prefer Odoo variant
    const unitPrice = (defaultProduct?.salesPrice || 1200) + (defaultVariant?.additionalPrice || 560);
    const taxRate = 18;
    const taxAmount = (unitPrice * taxRate) / 100;

    setQuoteLines([
      {
        id: `line_${Date.now()}`,
        productId: defaultProduct?.id || 'prod_1',
        productName: defaultProduct?.name || 'Business Management Software',
        variantId: defaultVariant?.id,
        variantName: defaultVariant?.name || 'Odoo Brand Edition (+560)',
        quantity: 1,
        unitPrice,
        taxRate,
        taxAmount,
        discountAmount: 0,
        subtotal: unitPrice,
        total: unitPrice + taxAmount
      }
    ]);
    setIsWizardOpen(true);
  };

  const addLine = () => {
    const prod = products[0];
    const unitPrice = prod?.salesPrice || 1200;
    const taxAmount = (unitPrice * 18) / 100;
    setQuoteLines([
      ...quoteLines,
      {
        id: `line_${Date.now()}_${Math.random()}`,
        productId: prod?.id || 'prod_1',
        productName: prod?.name || 'Business Management Software',
        quantity: 1,
        unitPrice,
        taxRate: 18,
        taxAmount,
        discountAmount: 0,
        subtotal: unitPrice,
        total: unitPrice + taxAmount
      }
    ]);
  };

  const removeLine = (id: string) => {
    if (quoteLines.length === 1) {
      showToast('A quotation must contain at least one line item', { type: 'warning' });
      return;
    }
    setQuoteLines(quoteLines.filter((l) => l.id !== id));
  };

  const updateLineQty = (id: string, qty: number) => {
    setQuoteLines(
      quoteLines.map((l) => {
        if (l.id === id) {
          const quantity = Math.max(1, qty);
          const subtotal = l.unitPrice * quantity;
          const taxAmount = (subtotal * l.taxRate) / 100;
          return {
            ...l,
            quantity,
            subtotal,
            taxAmount,
            total: subtotal + taxAmount - l.discountAmount
          };
        }
        return l;
      })
    );
  };

  const handleProductChange = (lineId: string, prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    const variant = p.variants?.[0];
    const unitPrice = p.salesPrice + (variant?.additionalPrice || 0);
    const taxAmount = (unitPrice * 18) / 100;

    setQuoteLines(
      quoteLines.map((l) => {
        if (l.id === lineId) {
          return {
            ...l,
            productId: p.id,
            productName: p.name,
            variantId: variant?.id,
            variantName: variant?.name,
            unitPrice,
            subtotal: unitPrice * l.quantity,
            taxAmount: (unitPrice * l.quantity * 18) / 100,
            total: unitPrice * l.quantity + (unitPrice * l.quantity * 18) / 100
          };
        }
        return l;
      })
    );
  };

  const handleVariantChange = (lineId: string, variantId: string) => {
    setQuoteLines(
      quoteLines.map((l) => {
        if (l.id === lineId) {
          const p = products.find((x) => x.id === l.productId);
          const v = p?.variants.find((x) => x.id === variantId);
          const unitPrice = (p?.salesPrice || 1000) + (v?.additionalPrice || 0);
          const subtotal = unitPrice * l.quantity;
          const taxAmount = (subtotal * 18) / 100;
          return {
            ...l,
            variantId: v?.id,
            variantName: v?.name,
            unitPrice,
            subtotal,
            taxAmount,
            total: subtotal + taxAmount - l.discountAmount
          };
        }
        return l;
      })
    );
  };

  // Calculations
  const subtotalTotal = quoteLines.reduce((acc, l) => acc + l.subtotal, 0);
  const taxTotal = quoteLines.reduce((acc, l) => acc + l.taxAmount, 0);
  const grandTotal = subtotalTotal + taxTotal;

  const handleFinalizeQuote = async (status: 'draft' | 'quotation' | 'confirmed') => {
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!cust) return;

    const today = new Date().toISOString().split('T')[0];
    const validUntilDate = new Date(Date.now() + validDays * 24 * 3600 * 1000).toISOString().split('T')[0];

    const res = await quotationApi.create({
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      planId: plan?.id,
      planName: plan?.name,
      quotationDate: today,
      validUntil: validUntilDate,
      lines: quoteLines,
      subtotal: subtotalTotal,
      taxTotal,
      discountTotal: 0,
      totalAmount: grandTotal,
      status,
      notes: notes || 'Proposal configured via Brightloop Quote Engine.',
      paymentTerms
    });

    if (res.success) {
      showToast(`Quotation ${res.data.quotationNumber} saved as ${status}`);
      setIsWizardOpen(false);
      loadAll();
    }
  };

  const handleConvertToSubscription = async (q: Quotation) => {
    const res = await quotationApi.convertToSubscription(q.id);
    if (res.success) {
      showToast(`Quotation ${q.quotationNumber} converted to active subscription ${res.data.subscriptionNumber}!`, {
        type: 'success'
      });
      setViewingQuote(null);
      loadAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Quotation Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build proposals with automated variant pricing, 18% tax calculation, and 1-click subscription conversion.
          </p>
        </div>

        <button
          onClick={openNewWizard}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quotation Wizard</span>
        </button>
      </div>

      {/* Quotation List Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Quote Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Plan Cadence</th>
                <th className="px-4 py-3 font-semibold">Date & Validity</th>
                <th className="px-4 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-semibold text-slate-200">{q.quotationNumber}</div>
                    <div className="text-[11px] text-slate-400">{q.lines.length} Line Item(s)</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-200">{q.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{q.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-300">{q.planName || 'Custom Configuration'}</div>
                    <div className="text-[11px] text-slate-400">{q.paymentTerms}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-200">{q.quotationDate}</div>
                    <div className="text-[11px] text-slate-400">Valid until {q.validUntil}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                    ${q.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingQuote(q)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        Inspect
                      </button>
                      {q.status !== 'converted' && (
                        <button
                          onClick={() => handleConvertToSubscription(q)}
                          className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Convert directly to active subscription and generate first invoice"
                        >
                          <Repeat className="w-3 h-3" />
                          <span>Convert</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Multi-Step Quotation Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Quotation Creation Wizard"
        subtitle={`Step ${wizardStep} of 3 · Automated Tax & Variant Math`}
        maxWidth="4xl"
      >
        <div className="space-y-5 text-xs">
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-6">
              <span className={`font-semibold ${wizardStep === 1 ? 'text-indigo-400' : 'text-slate-400'}`}>
                1. Customer & Plan
              </span>
              <span className="text-slate-600">→</span>
              <span className={`font-semibold ${wizardStep === 2 ? 'text-indigo-400' : 'text-slate-400'}`}>
                2. Products & Variants (+560 Markups)
              </span>
              <span className="text-slate-600">→</span>
              <span className={`font-semibold ${wizardStep === 3 ? 'text-indigo-400' : 'text-slate-400'}`}>
                3. Tax Review & Confirm
              </span>
            </div>
          </div>

          {/* Step 1: Customer & Plan Selection */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Subscription Plan *</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price}/{p.billingInterval})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quotation Validity</label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={15}>15 Days Validity</option>
                    <option value={30}>30 Days Validity (Standard)</option>
                    <option value={60}>60 Days Validity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>Continue to Line Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Line items & Variant pricing */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Quotation Line Items</span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Add Another Product
                </button>
              </div>

              <div className="space-y-3">
                {quoteLines.map((line) => {
                  const currentProd = products.find((p) => p.id === line.productId);
                  return (
                    <div
                      key={line.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Product */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] text-slate-400 mb-1">Product</label>
                          <select
                            value={line.productId}
                            onChange={(e) => handleProductChange(line.id, e.target.value)}
                            className="w-full bg-[#F7FAFA] border border-slate-700 rounded-lg p-2 text-slate-100"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Variant */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-slate-400 mb-1">Variant (Adder)</label>
                          <select
                            value={line.variantId || ''}
                            onChange={(e) => handleVariantChange(line.id, e.target.value)}
                            className="w-full bg-[#F7FAFA] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[11px]"
                          >
                            {currentProd?.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.additionalPrice > 0 ? `+$${v.additionalPrice}` : '$0'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineQty(line.id, Number(e.target.value))}
                            className="w-full bg-[#F7FAFA] border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                          />
                        </div>

                        {/* Delete line */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Line subtotal preview */}
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span>Unit: ${line.unitPrice} · 18% Tax: ${line.taxAmount.toFixed(1)}</span>
                        <span className="font-mono font-semibold text-slate-100">
                          Line Total: ${line.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <span>Review Subtotal & Taxes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Finalize */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Quotation Financial Breakdown
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Products Subtotal</span>
                    <span className="font-mono">${subtotalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Statutory Tax (18% Automated GST/VAT)</span>
                    <span className="font-mono text-indigo-400">+${taxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-slate-800">
                    <span>Final Quote Total</span>
                    <span className="font-mono text-emerald-400">${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Proposal Notes & Special Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Special enterprise pricing valid through end of quarter..."
                  className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFinalizeQuote('draft')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalizeQuote('confirmed')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                  >
                    Confirm Proposal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Viewing Quotation Detail Modal */}
      {viewingQuote && (
        <Modal
          isOpen={!!viewingQuote}
          onClose={() => setViewingQuote(null)}
          title={`Quotation ${viewingQuote.quotationNumber}`}
          subtitle={`Issued to ${viewingQuote.customerName} on ${viewingQuote.quotationDate}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-400">Current Status:</span>
                <div className="mt-1">
                  <StatusBadge status={viewingQuote.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Valid Until:</span>
                <div className="font-mono text-slate-200 mt-1">{viewingQuote.validUntil}</div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Item & Variant</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Tax (18%)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingQuote.lines.map((l) => (
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

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-right font-mono">
              <div className="text-slate-400">Subtotal: ${viewingQuote.subtotal.toLocaleString()}</div>
              <div className="text-slate-400">Tax Total: ${viewingQuote.taxTotal.toLocaleString()}</div>
              <div className="text-base font-bold text-emerald-400 pt-1 border-t border-slate-800">
                Grand Total: ${viewingQuote.totalAmount.toLocaleString()}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewingQuote(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
              {viewingQuote.status !== 'converted' && (
                <button
                  type="button"
                  onClick={() => handleConvertToSubscription(viewingQuote)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Convert to Active Subscription</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
