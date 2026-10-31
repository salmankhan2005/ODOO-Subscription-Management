import React, { useState, useEffect } from 'react';
import { planApi, productApi } from '../../api/services';
import { SubscriptionPlan, Product, BillingInterval } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Repeat, Calendar, ShieldCheck, Check } from 'lucide-react';

export const PlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    productId: '',
    billingInterval: 'monthly' as BillingInterval,
    intervalCount: 1,
    price: 1200,
    minimumQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoCloseOnEnd: false,
    allowEarlyCancel: true,
    allowPause: true,
    allowRenewal: true,
    description: '',
    status: 'active' as 'active' | 'archived'
  });

  const loadData = async () => {
    const pRes = await planApi.getAll();
    if (pRes.success) setPlans(pRes.data);

    const prodRes = await productApi.getAll();
    if (prodRes.success) {
      setProducts(prodRes.data);
      if (prodRes.data.length > 0 && !form.productId) {
        setForm((prev) => ({ ...prev, productId: prodRes.data[0].id }));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.productId) {
      showToast('Plan name and product are required', { type: 'error' });
      return;
    }
    const res = await planApi.create(form);
    if (res.success) {
      showToast(`Plan ${res.data.name} activated`);
      setIsModalOpen(false);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Subscription Plans & Cadences</h1>
          <p className="text-xs text-slate-400 mt-1">
            Define recurring billing intervals (daily, weekly, monthly, yearly), pause policies, and renewal behavior.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const associatedProd = products.find((p) => p.id === plan.productId);
          return (
            <BentoCard key={plan.id} glow className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    {plan.billingInterval} Cadence
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {plan.subscriptionCount || 0} Subscriptions
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{plan.name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Product: {associatedProd?.name || 'Modular Software'}
                </div>

                <div className="my-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold font-mono text-white">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-normal"> / {plan.billingInterval}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Min. {plan.minimumQuantity} seat(s)</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>

                {/* Plan Policy Matrix */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Check className={`w-3.5 h-3.5 ${plan.allowPause ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Allow Pause: {plan.allowPause ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Check className={`w-3.5 h-3.5 ${plan.allowRenewal ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Auto-Renewal: {plan.allowRenewal ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Check className={`w-3.5 h-3.5 ${plan.allowEarlyCancel ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Early Cancel: {plan.allowEarlyCancel ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Check className={`w-3.5 h-3.5 ${plan.autoCloseOnEnd ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span>Auto-Close: {plan.autoCloseOnEnd ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
        subtitle="Configure billing intervals, automated closures, and customer flexibility."
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Plan Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Business Pro Annual Edition"
              className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Associated Product *</label>
              <select
                required
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.salesPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Billing Interval *</label>
              <select
                value={form.billingInterval}
                onChange={(e) => setForm({ ...form, billingInterval: e.target.value as any })}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cadence Price ($) *</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Minimum Quantity</label>
              <input
                type="number"
                min="1"
                value={form.minimumQuantity}
                onChange={(e) => setForm({ ...form, minimumQuantity: Number(e.target.value) })}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Policy Flags */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Lifecycle & Renewal Policies
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowPause}
                onChange={(e) => setForm({ ...form, allowPause: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Allow customers & staff to pause subscriptions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowRenewal}
                onChange={(e) => setForm({ ...form, allowRenewal: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Auto-renew subscription at end of billing cycle</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoCloseOnEnd}
                onChange={(e) => setForm({ ...form, autoCloseOnEnd: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Automatically close on expiry date without rollover</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Terms and entitlement details..."
              className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              Save & Activate Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
