import React, { useState, useEffect } from 'react';
import { planApi, productApi } from '../../api/services';
import { SubscriptionPlan, Product, BillingInterval } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Check } from 'lucide-react';

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
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Subscription Plans &amp; Cadences
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Define recurring billing intervals (daily, weekly, monthly, yearly), pause policies, and renewal behavior.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
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
            <BentoCard key={plan.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5ECEC] text-xs">
                  <span className="font-mono font-semibold text-[#345C64] capitalize">
                    {plan.billingInterval} Cadence
                  </span>
                  <span className="font-mono font-semibold text-[#2E9F92]">
                    {plan.subscriptionCount || 0} Active
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#252B2E] font-display mt-3">{plan.name}</h3>
                <div className="text-xs text-[#56666B] mt-0.5">
                  Product: {associatedProd?.name || 'Modular Software'}
                </div>

                <div className="my-4 p-4 rounded-xl bg-[#345C64] text-white flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold font-mono text-white">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#DDF3F0] font-normal"> / {plan.billingInterval}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#DDF3F0]">Min. {plan.minimumQuantity} seat(s)</span>
                </div>

                <p className="text-xs text-[#56666B] leading-relaxed">{plan.description}</p>

                {/* Concrete Plan Policy Matrix */}
                <div className="mt-4 pt-3 border-t border-[#E5ECEC] grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#252B2E]">
                    <Check className={`w-3.5 h-3.5 ${plan.allowPause ? 'text-[#2E9F92]' : 'text-[#9AB0B4]'}`} />
                    <span>Pause Policy: {plan.allowPause ? 'Allowed' : 'Locked'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#252B2E]">
                    <Check className={`w-3.5 h-3.5 ${plan.allowRenewal ? 'text-[#2E9F92]' : 'text-[#9AB0B4]'}`} />
                    <span>Auto-Renewal: {plan.allowRenewal ? 'Active' : 'Manual'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#252B2E]">
                    <Check className={`w-3.5 h-3.5 ${plan.allowEarlyCancel ? 'text-[#2E9F92]' : 'text-[#9AB0B4]'}`} />
                    <span>Early Cancel: {plan.allowEarlyCancel ? 'Permitted' : 'Term Bound'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#252B2E]">
                    <Check className={`w-3.5 h-3.5 ${plan.autoCloseOnEnd ? 'text-[#E96F50]' : 'text-[#9AB0B4]'}`} />
                    <span>Auto-Close: {plan.autoCloseOnEnd ? 'On Expiry' : 'Continuous'}</span>
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
        subtitle="Configure billing intervals, automated closures, and subscriber flexibility."
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Plan Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Business Pro Annual Edition"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Associated Product *</label>
              <select
                required
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.salesPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Billing Interval *</label>
              <select
                value={form.billingInterval}
                onChange={(e) => setForm({ ...form, billingInterval: e.target.value as any })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
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
              <label className="block font-semibold text-[#252B2E] mb-1">Cadence Price ($) *</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Minimum Quantity</label>
              <input
                type="number"
                min="1"
                value={form.minimumQuantity}
                onChange={(e) => setForm({ ...form, minimumQuantity: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2.5">
            <span className="text-[11px] font-semibold text-[#345C64] block">
              Lifecycle &amp; Renewal Policies
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowPause}
                onChange={(e) => setForm({ ...form, allowPause: e.target.checked })}
                className="w-4 h-4 rounded border-[#C5D4D4] accent-[#1F3F47]"
              />
              <span className="text-[#252B2E]">Allow customers &amp; staff to pause subscriptions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowRenewal}
                onChange={(e) => setForm({ ...form, allowRenewal: e.target.checked })}
                className="w-4 h-4 rounded border-[#C5D4D4] accent-[#1F3F47]"
              />
              <span className="text-[#252B2E]">Auto-renew subscription at end of billing cycle</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoCloseOnEnd}
                onChange={(e) => setForm({ ...form, autoCloseOnEnd: e.target.checked })}
                className="w-4 h-4 rounded border-[#C5D4D4] accent-[#1F3F47]"
              />
              <span className="text-[#252B2E]">Automatically close on expiry date without rollover</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Terms and entitlement details..."
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5ECEC]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold"
            >
              Save &amp; Activate Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
