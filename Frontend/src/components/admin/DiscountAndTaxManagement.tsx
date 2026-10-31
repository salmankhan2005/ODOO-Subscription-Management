import React, { useState, useEffect } from 'react';
import { discountApi, taxApi } from '../../api/services';
import { DiscountRule, TaxRule } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Percent, Calculator, Tag, Sparkles } from 'lucide-react';

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
    applicableProductIds: [],
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
    applicableProductIds: [],
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
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Taxes & Automated Discounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure statutory tax rules (e.g. 18% GST/VAT) and multi-seat customer incentive vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Discount Rule</span>
          </button>
          <button
            onClick={() => setIsTaxModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Configure Tax Rule</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Calculation Simulator Banner */}
      <BentoCard glow className="border-indigo-500/40">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Interactive Tax & Discount Real-Time Pricing Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Test how rules apply automatically to recurring subscriptions before saving.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Base Price ($)</label>
            <input
              type="number"
              value={simPrice}
              onChange={(e) => setSimPrice(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Tax Percentage (%)</label>
            <input
              type="number"
              value={simTaxRate}
              onChange={(e) => setSimTaxRate(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
              Discount ({simDiscountType === 'percentage' ? '%' : '$'})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={simDiscountVal}
                onChange={(e) => setSimDiscountVal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setSimDiscountType(simDiscountType === 'percentage' ? 'fixed' : 'percentage')}
                className="px-2 rounded bg-slate-800 text-[10px] font-mono text-slate-300 hover:text-white"
              >
                {simDiscountType === 'percentage' ? '%' : '$'}
              </button>
            </div>
          </div>

          {/* Result preview */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Discounted Base:</span>
              <span>${priceAfterDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Tax ({simTaxRate}%):</span>
              <span>+${calculatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1 border-t border-slate-800">
              <span>Final Billed:</span>
              <span>${calculatedFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Two Column Grid: Discounts & Taxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Discounts */}
        <BentoCard
          title="Active Discount Rules"
          subtitle="Automatic vouchers applied to quotations and recurring cycles"
        >
          <div className="space-y-3 mt-2">
            {discounts.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">{d.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {d.code}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>
                    Reduction: <strong className="text-white">{d.type === 'fixed' ? `$${d.value || 0} Flat` : `${d.value || 0}% Off`}</strong>
                  </span>
                  <span>Min. Purchase: ${d.minimumPurchase || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Valid until {d.endDate || 'Ongoing'}</span>
                  <span className="font-mono">{d.usageCount || 0} / {d.maxUsage || '∞'} claimed</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Configured Taxes */}
        <BentoCard
          title="Tax Jurisdiction Rules"
          subtitle="Statutory VAT / GST automatically appended to generated invoices"
        >
          <div className="space-y-3 mt-2">
            {taxes.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{t.name}</span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    {t.percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="capitalize">Type: {(t.type || 'sales').toUpperCase()}</span>
                  <span>Scope: All SaaS Software Lines</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                  Effective from {t.startDate || 'Immediate'} · Auto-calculated on Billing Day
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
        subtitle="Only authorized admins can define pricing discount rules."
        maxWidth="md"
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Discount Name *</label>
            <input
              type="text"
              required
              value={discForm.name}
              onChange={(e) => setDiscForm({ ...discForm, name: e.target.value })}
              placeholder="e.g. Enterprise Volume Incentive"
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Promo Code *</label>
              <input
                type="text"
                required
                value={discForm.code}
                onChange={(e) => setDiscForm({ ...discForm, code: e.target.value.toUpperCase() })}
                placeholder="ENTERPRISE20"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Discount Type</label>
              <select
                value={discForm.type}
                onChange={(e) => setDiscForm({ ...discForm, type: e.target.value as any })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Dollar ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Discount Value *</label>
              <input
                type="number"
                required
                value={discForm.value}
                onChange={(e) => setDiscForm({ ...discForm, value: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Minimum Purchase ($)</label>
              <input
                type="number"
                value={discForm.minimumPurchase}
                onChange={(e) => setDiscForm({ ...discForm, minimumPurchase: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Max Usages</label>
              <input
                type="number"
                value={discForm.maxUsage}
                onChange={(e) => setDiscForm({ ...discForm, maxUsage: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Valid Until</label>
              <input
                type="date"
                value={discForm.endDate}
                onChange={(e) => setDiscForm({ ...discForm, endDate: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
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
            <label className="block font-semibold text-slate-300 mb-1">Tax Name *</label>
            <input
              type="text"
              required
              value={taxForm.name}
              onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
              placeholder="e.g. EU Cross-Border VAT (20%)"
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tax Percentage (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={taxForm.percentage}
                onChange={(e) => setTaxForm({ ...taxForm, percentage: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tax Category</label>
              <select
                value={taxForm.type}
                onChange={(e) => setTaxForm({ ...taxForm, type: e.target.value as any })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="gst">GST (Goods & Services Tax)</option>
                <option value="vat">VAT (Value Added Tax)</option>
                <option value="sales">Sales Tax</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
            >
              Activate Tax
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
