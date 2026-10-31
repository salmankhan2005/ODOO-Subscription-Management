import React, { useState, useEffect } from 'react';
import { quotationApi, customerApi, productApi, planApi } from '../../api/services';
import { Quotation, Customer, Product, SubscriptionPlan, LineItem } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Repeat, Trash2, ArrowRight } from 'lucide-react';

export const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);

  const { showToast } = useToast();

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
    const defaultVariant = defaultProduct?.variants[1] || defaultProduct?.variants[0];
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
    const variant = p.variants[0];
    const unitPrice = p.salesPrice + (variant?.additionalPrice || 0);

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
      notes: notes || 'Proposal configured via Brightloop Quotation Engine.',
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
      showToast(`Quotation ${q.quotationNumber} converted to active subscription ${res.data.subscriptionNumber}`, {
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
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">Quotation Engine</h1>
          <p className="text-xs text-[#56666B] mt-1">
            Build proposals with automated variant pricing, 18% statutory tax calculation, and 1-click contract conversion.
          </p>
        </div>

        <button
          onClick={openNewWizard}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quotation Wizard</span>
        </button>
      </div>

      {/* Quotation List Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFA] text-[11px] text-[#56666B] border-b border-[#E5ECEC]">
              <tr>
                <th className="px-5 py-3 font-semibold">Quote Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Plan Cadence</th>
                <th className="px-4 py-3 font-semibold">Date &amp; Validity</th>
                <th className="px-4 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEC]">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-[#F7FAFA] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-[#1F3F47]">{q.quotationNumber}</div>
                    <div className="text-[11px] text-[#56666B]">{q.lines.length} Line Item(s)</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[#252B2E]">{q.customerName}</div>
                    <div className="text-[11px] text-[#56666B] font-mono">{q.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-[#252B2E]">{q.planName || 'Custom Configuration'}</div>
                    <div className="text-[11px] text-[#56666B]">{q.paymentTerms}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono">
                    <div className="text-[#252B2E]">{q.quotationDate}</div>
                    <div className="text-[11px] text-[#56666B]">Valid until {q.validUntil}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-[#252B2E]">
                    ${q.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingQuote(q)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                      {q.status !== 'converted' && (
                        <button
                          onClick={() => handleConvertToSubscription(q)}
                          className="px-3 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
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
          <div className="flex items-center justify-between border-b border-[#E5ECEC] pb-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`font-semibold ${wizardStep === 1 ? 'text-[#1F3F47]' : 'text-[#56666B]'}`}>
                01. Customer &amp; Plan
              </span>
              <span className="text-[#9AB0B4]">→</span>
              <span className={`font-semibold ${wizardStep === 2 ? 'text-[#1F3F47]' : 'text-[#56666B]'}`}>
                02. Products &amp; Edition Markups
              </span>
              <span className="text-[#9AB0B4]">→</span>
              <span className={`font-semibold ${wizardStep === 3 ? 'text-[#1F3F47]' : 'text-[#56666B]'}`}>
                03. Tax Review &amp; Confirm
              </span>
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#252B2E] mb-1">Select Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#252B2E] mb-1">Target Subscription Plan *</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
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
                  <label className="block font-semibold text-[#252B2E] mb-1">Quotation Validity</label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                  >
                    <option value={15}>15 Days Validity</option>
                    <option value={30}>30 Days Validity (Standard)</option>
                    <option value={60}>60 Days Validity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#252B2E] mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Continue to Line Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#252B2E]">Quotation Line Items</span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-[#1F3F47] hover:text-[#2E9F92] font-semibold"
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
                      className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] text-[#56666B] font-medium mb-1">Product</label>
                          <select
                            value={line.productId}
                            onChange={(e) => handleProductChange(line.id, e.target.value)}
                            className="w-full bg-white border border-[#E5ECEC] rounded-lg p-2 text-[#252B2E]"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-[#56666B] font-medium mb-1">Variant (Adder)</label>
                          <select
                            value={line.variantId || ''}
                            onChange={(e) => handleVariantChange(line.id, e.target.value)}
                            className="w-full bg-white border border-[#E5ECEC] rounded-lg p-2 text-[#252B2E] font-mono text-[11px]"
                          >
                            {currentProd?.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.additionalPrice > 0 ? `+$${v.additionalPrice}` : '$0'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-[#56666B] font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineQty(line.id, Number(e.target.value))}
                            className="w-full bg-white border border-[#E5ECEC] rounded-lg p-2 text-[#252B2E] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="p-2 text-[#56666B] hover:text-[#E96F50] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-[#56666B] pt-2 border-t border-[#E5ECEC] font-mono">
                        <span>Unit: ${line.unitPrice} · 18% Tax: ${line.taxAmount.toFixed(1)}</span>
                        <span className="font-bold text-[#1F3F47]">
                          Line Total: ${line.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-[#E5ECEC]">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold flex items-center gap-1.5"
                >
                  <span>Review Subtotal &amp; Taxes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-[#345C64] text-white space-y-3">
                <div className="font-semibold text-[#DDF3F0] border-b border-white/15 pb-2">
                  Quotation Financial Breakdown
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[#DDF3F0]">
                    <span>Products Subtotal</span>
                    <span className="font-mono text-white">${subtotalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#DDF3F0]">
                    <span>Statutory Tax (18% Automated GST/VAT)</span>
                    <span className="font-mono text-[#8CE6DB]">+${taxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/15">
                    <span>Final Quote Total</span>
                    <span className="font-mono text-white">${grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Proposal Notes &amp; Special Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Enterprise terms valid through end of quarter..."
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5ECEC]">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFinalizeQuote('draft')}
                    className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#252B2E] font-semibold"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalizeQuote('confirmed')}
                    className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold"
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
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC]">
              <div>
                <span className="text-[#56666B]">Current Status:</span>
                <div className="mt-1">
                  <StatusBadge status={viewingQuote.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[#56666B]">Valid Until:</span>
                <div className="font-mono font-semibold text-[#252B2E] mt-1">{viewingQuote.validUntil}</div>
              </div>
            </div>

            <div className="border border-[#E5ECEC] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                  <tr>
                    <th className="p-3 font-semibold">Item &amp; Variant</th>
                    <th className="p-3 font-semibold text-center">Qty</th>
                    <th className="p-3 font-semibold text-right">Unit Price</th>
                    <th className="p-3 font-semibold text-right">Tax (18%)</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEC]">
                  {viewingQuote.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3">
                        <div className="font-semibold text-[#252B2E]">{l.productName}</div>
                        {l.variantName && <div className="text-[11px] text-[#345C64]">{l.variantName}</div>}
                      </td>
                      <td className="p-3 text-center font-mono">{l.quantity}</td>
                      <td className="p-3 text-right font-mono">${l.unitPrice}</td>
                      <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#252B2E]">
                        ${l.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[#345C64] text-white space-y-1 text-right font-mono">
              <div className="text-[#DDF3F0]">Subtotal: ${viewingQuote.subtotal.toLocaleString()}</div>
              <div className="text-[#DDF3F0]">Tax Total: ${viewingQuote.taxTotal.toLocaleString()}</div>
              <div className="text-base font-bold text-white pt-1.5 border-t border-white/15">
                Grand Total: ${viewingQuote.totalAmount.toLocaleString()}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E5ECEC]">
              <button
                type="button"
                onClick={() => setViewingQuote(null)}
                className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
              >
                Close
              </button>
              {viewingQuote.status !== 'converted' && (
                <button
                  type="button"
                  onClick={() => handleConvertToSubscription(viewingQuote)}
                  className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold flex items-center gap-1.5"
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
