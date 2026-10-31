import React, { useState, useEffect } from 'react';
import { discountApi, taxApi } from '../../api/services';
import { DiscountRule, TaxRule } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Calculator, Tag, SlidersHorizontal } from 'lucide-react';

export const DiscountAndTaxManagement: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [taxes, setTaxes] = useState<TaxRule[]>([]);

  // Modals
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

  // Interactive Live Simulators State
  const [simPrice, setSimPrice] = useState<number>(1000);
  const [simTaxRate, setSimTaxRate] = useState<number>(18);
  const [simDiscountType, setSimDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [simDiscountVal, setSimDiscountVal] = useState<number>(15);

  const { showToast } = useToast();

  // Discount form
  const [discForm, setDiscForm] = useState({
    name: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 15,
    minimumPurchase: 500,
    minimumQuantity: 1,
    applicableProductIds: [] as string[],
    applicableSubscriptions: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    maxUsage: 100,
    status: 'active' as const
  });

  // Tax form
  const [taxForm, setTaxForm] = useState({
    name: '',
    percentage: 18,
    type: 'gst' as 'sales' | 'vat' | 'gst',
    applicableProductIds: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as const
  });

  const loadData = async () => {
    const dRes = await discountApi.getAll();
    if (dRes.success) setDiscounts(dRes.data);

    const tRes = await taxApi.getAll();
    if (tRes.success) setTaxes(tRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Simulator math
  const calculatedDiscount =
    simDiscountType === 'percentage'
      ? (simPrice * simDiscountVal) / 100
      : Math.min(simPrice, simDiscountVal);
  const priceAfterDiscount = Math.max(0, simPrice - calculatedDiscount);
  const calculatedTax = (priceAfterDiscount * simTaxRate) / 100;
  const calculatedFinal = priceAfterDiscount + calculatedTax;

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discForm.name || !discForm.code) {
      showToast('Name and code are required', { type: 'error' });
      return;
    }
    const res = await discountApi.create(discForm);
    if (res.success) {
      showToast(`Discount code ${res.data.code} configured`);
      setIsDiscountModalOpen(false);
      loadData();
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxForm.name) {
      showToast('Tax rule name is required', { type: 'error' });
      return;
    }
    const res = await taxApi.create(taxForm);
    if (res.success) {
      showToast(`Tax rule ${res.data.name} active`);
      setIsTaxModalOpen(false);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Statutory Taxes & Automated Discounts
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Configure regional VAT/GST tax schedules and volume-based commercial discount rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:bg-[#DDF3F0]/50 text-[#252B2E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#345C64]" />
            <span>Add Discount Rule</span>
          </button>
          <button
            onClick={() => setIsTaxModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Configure Tax Rule</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Calculation Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <BentoCard className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-4 h-4 text-[#345C64]" />
              <h2 className="text-base font-semibold text-[#252B2E] tracking-tight font-display">
                Real-Time Tax & Voucher Computation Sandbox
              </h2>
            </div>
            <p className="text-xs text-[#56666B] mb-5">
              Preview net recurring invoice computation across promotional reductions and statutory jurisdictions before publishing rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#56666B] mb-1.5">
                Contract Base ($)
              </label>
              <input
                type="number"
                value={simPrice}
                onChange={(e) => setSimPrice(Number(e.target.value))}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-xs font-mono tabular-nums text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#56666B] mb-1.5">
                Discount ({simDiscountType === 'percentage' ? '%' : '$'})
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={simDiscountVal}
                  onChange={(e) => setSimDiscountVal(Number(e.target.value))}
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-xs font-mono tabular-nums text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                />
                <button
                  type="button"
                  onClick={() => setSimDiscountType(simDiscountType === 'percentage' ? 'fixed' : 'percentage')}
                  className="px-3 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-xs font-mono font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                  title="Toggle Percentage or Flat Dollar"
                >
                  {simDiscountType === 'percentage' ? '%' : '$'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#56666B] mb-1.5">
                Statutory Tax (%)
              </label>
              <input
                type="number"
                value={simTaxRate}
                onChange={(e) => setSimTaxRate(Number(e.target.value))}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-xs font-mono tabular-nums text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>
        </BentoCard>

        {/* Primary Teal Live Receipt Summary */}
        <BentoCard variant="teal" className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DDF3F0]/85 block">
              Computed Statement Preview
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1.5">
              ${calculatedFinal.toFixed(2)}
            </div>
            <span className="text-[11px] text-[#DDF3F0]/80 block mt-0.5">Net recurring settlement per cycle</span>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/15 space-y-1.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-[#DDF3F0]/85">
              <span>Discount Applied</span>
              <span className="text-[#FFBFB0]">-${calculatedDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#DDF3F0]/85">
              <span>Taxable Subtotal</span>
              <span>${priceAfterDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#8CE6DB] font-semibold">
              <span>Statutory Tax ({simTaxRate}%)</span>
              <span>+${calculatedTax.toFixed(2)}</span>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Two Column Grid: Discounts & Taxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Discounts */}
        <BentoCard
          title="Commercial Discount Schedules"
          subtitle="Automatic vouchers applied to enterprise quotes and recurring renewals"
        >
          <div className="space-y-3">
            {discounts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2 text-xs hover:border-[#345C64]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#345C64] shrink-0" />
                    <span className="font-semibold text-[#252B2E]">{d.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1F3F47] tracking-wide">
                    {d.code}
                  </span>
                </div>

                <div className="flex justify-between text-[#56666B]">
                  <span>
                    Reduction:{' '}
                    <strong className="text-[#252B2E] font-mono tabular-nums">
                      {d.type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat`}
                    </strong>
                  </span>
                  <span className="font-mono tabular-nums">Min. Order: ${d.minimumPurchase}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#56666B] pt-2 border-t border-[#E5ECEC]">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <span className="font-mono tabular-nums">· Valid thru {d.endDate}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[#345C64] font-semibold">
                    {d.usageCount} / {d.maxUsage} redeemed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Configured Taxes */}
        <BentoCard
          title="Tax Jurisdiction Schedules"
          subtitle="Statutory VAT, GST, and Sales Tax appended to generated statements"
        >
          <div className="space-y-3">
            {taxes.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2 text-xs hover:border-[#345C64]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#2E9F92] shrink-0" />
                    <span className="font-semibold text-[#252B2E]">{t.name}</span>
                  </div>
                  <span className="font-mono tabular-nums text-base font-bold text-[#2E9F92]">
                    {t.percentage}%
                  </span>
                </div>

                <div className="flex justify-between text-[#56666B]">
                  <span>Regime: {t.type.toUpperCase()}</span>
                  <span>Scope: All Recurring Software SKUs</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#56666B] pt-2 border-t border-[#E5ECEC]">
                  <StatusBadge status={t.status} />
                  <span className="font-mono tabular-nums">Effective {t.startDate}</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Create Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Create Discount Rule"
        subtitle="Define automated voucher incentives for quotations and subscriptions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Discount Name *</label>
            <input
              type="text"
              required
              value={discForm.name}
              onChange={(e) => setDiscForm({ ...discForm, name: e.target.value })}
              placeholder="e.g. Enterprise Volume Incentive"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Promo Code *</label>
              <input
                type="text"
                required
                value={discForm.code}
                onChange={(e) => setDiscForm({ ...discForm, code: e.target.value.toUpperCase() })}
                placeholder="ENTERPRISE20"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] placeholder-[#56666B] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Discount Type</label>
              <select
                value={discForm.type}
                onChange={(e) => setDiscForm({ ...discForm, type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Dollar ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Discount Value *</label>
              <input
                type="number"
                required
                value={discForm.value}
                onChange={(e) => setDiscForm({ ...discForm, value: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Minimum Purchase ($)</label>
              <input
                type="number"
                value={discForm.minimumPurchase}
                onChange={(e) => setDiscForm({ ...discForm, minimumPurchase: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Max Redemptions</label>
              <input
                type="number"
                value={discForm.maxUsage}
                onChange={(e) => setDiscForm({ ...discForm, maxUsage: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Valid Until</label>
              <input
                type="date"
                value={discForm.endDate}
                onChange={(e) => setDiscForm({ ...discForm, endDate: e.target.value })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5ECEC]">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#E5ECEC]/60 text-[#252B2E] font-medium whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Save Discount
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Tax Modal */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title="Configure Tax Jurisdiction"
        subtitle="Applies automatically to invoices generated from active subscriptions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Tax Name *</label>
            <input
              type="text"
              required
              value={taxForm.name}
              onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
              placeholder="e.g. EU Cross-Border VAT (20%)"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Tax Percentage (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={taxForm.percentage}
                onChange={(e) => setTaxForm({ ...taxForm, percentage: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono tabular-nums focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Tax Category</label>
              <select
                value={taxForm.type}
                onChange={(e) => setTaxForm({ ...taxForm, type: e.target.value as 'sales' | 'vat' | 'gst' })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                <option value="gst">GST (Goods & Services Tax)</option>
                <option value="vat">VAT (Value Added Tax)</option>
                <option value="sales">Sales Tax</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5ECEC]">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#E5ECEC]/60 text-[#252B2E] font-medium whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Activate Tax Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
