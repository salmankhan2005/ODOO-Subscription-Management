import React, { useState, useEffect } from 'react';
import { productApi } from '../../api/services';
import { Product } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Tag, Layers, CheckCircle2 } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [previewVariantIndex, setPreviewVariantIndex] = useState<Record<string, number>>({});

  const { showToast } = useToast();

  const [productForm, setProductForm] = useState({
    name: '',
    type: 'software' as 'software' | 'service' | 'addon',
    salesPrice: 1000,
    costPrice: 300,
    description: '',
    notes: '',
    status: 'active' as 'active' | 'archived',
    variants: [{ id: 'var_std', name: 'Standard Edition', additionalPrice: 0 }]
  });

  const [variantForm, setVariantForm] = useState({
    name: '',
    additionalPrice: 560,
    sku: ''
  });

  const loadProducts = async () => {
    const res = await productApi.getAll();
    if (res.success) setProducts(res.data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name) {
      showToast('Product name is required', { type: 'error' });
      return;
    }
    const res = await productApi.create(productForm);
    if (res.success) {
      showToast(`Product ${res.data.name} created successfully`);
      setIsAddModalOpen(false);
      loadProducts();
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForVariant || !variantForm.name) return;

    const res = await productApi.addVariant(selectedProductForVariant.id, {
      name: variantForm.name,
      additionalPrice: Number(variantForm.additionalPrice),
      sku: variantForm.sku
    });

    if (res.success) {
      showToast(`Variant added to ${selectedProductForVariant.name}`);
      setSelectedProductForVariant(null);
      setVariantForm({ name: '', additionalPrice: 560, sku: '' });
      loadProducts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Product Catalog & Variants</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure software base prices, brand markups (+560 Odoo adder), and add-on subscriptions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product Cards with Interactive Variant Price Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {products.map((prod) => {
          const activeVarIdx = previewVariantIndex[prod.id] || 0;
          const currentVariant = prod.variants[activeVarIdx] || prod.variants[0];
          const dynamicEffectivePrice = prod.salesPrice + (currentVariant ? currentVariant.additionalPrice : 0);
          const margin = Math.round(((dynamicEffectivePrice - prod.costPrice) / dynamicEffectivePrice) * 100);

          return (
            <BentoCard key={prod.id} glow className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    {prod.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Cost: ${prod.costPrice}</span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{prod.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prod.description}</p>

                {/* Dynamic Price Display */}
                <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      Effective Sales Price
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-white">
                      ${dynamicEffectivePrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-emerald-400">
                    {margin}% Margin
                  </span>
                </div>

                {/* Variants List & Interactive Selector */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Configured Variants ({prod.variants.length})</span>
                    <button
                      onClick={() => setSelectedProductForVariant(prod)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-[11px]"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {prod.variants.map((v, idx) => (
                      <button
                        key={v.id}
                        onClick={() =>
                          setPreviewVariantIndex({
                            ...previewVariantIndex,
                            [prod.id]: idx
                          })
                        }
                        className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                          activeVarIdx === idx
                            ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span className="font-medium text-slate-200">{v.name}</span>
                        </div>
                        <span className="font-mono text-indigo-400 font-semibold">
                          {v.additionalPrice > 0 ? `+$${v.additionalPrice}` : 'Base Price'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes footer */}
              {prod.notes && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
                  Note: {prod.notes}
                </div>
              )}
            </BentoCard>
          );
        })}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Catalog Product"
        subtitle="Define base software or add-on product offering"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Brightloop ERP Core"
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Product Type</label>
              <select
                value={productForm.type}
                onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="software">Software</option>
                <option value="service">Service / SLA</option>
                <option value="addon">Add-On</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Base Sales Price ($)</label>
              <input
                type="number"
                required
                value={productForm.salesPrice}
                onChange={(e) => setProductForm({ ...productForm, salesPrice: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cost Price ($)</label>
              <input
                type="number"
                required
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Product capabilities and subscription scope..."
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Internal Operations Notes</label>
            <input
              type="text"
              value={productForm.notes}
              onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
              placeholder="e.g. Included in Odoo ecosystem tier"
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      {selectedProductForVariant && (
        <Modal
          isOpen={!!selectedProductForVariant}
          onClose={() => setSelectedProductForVariant(null)}
          title={`Add Variant to ${selectedProductForVariant.name}`}
          subtitle="Configure edition pricing markup (e.g. Odoo brand +$560)"
        >
          <form onSubmit={handleAddVariant} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Variant Name *</label>
              <input
                type="text"
                required
                value={variantForm.name}
                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                placeholder="e.g. Odoo Brand Edition"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Additional Price ($) *</label>
                <input
                  type="number"
                  required
                  value={variantForm.additionalPrice}
                  onChange={(e) => setVariantForm({ ...variantForm, additionalPrice: Number(e.target.value) })}
                  placeholder="560"
                  className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">SKU / Code</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="BMS-ODOO-560"
                  className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Dynamic Preview */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400">Total Customer Price:</span>
                <div className="text-base font-bold font-mono text-emerald-400">
                  ${selectedProductForVariant.salesPrice + Number(variantForm.additionalPrice)}
                </div>
              </div>
              <span className="text-[11px] text-slate-500">Base ${selectedProductForVariant.salesPrice} + Adder ${variantForm.additionalPrice}</span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProductForVariant(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
              >
                Attach Variant
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
