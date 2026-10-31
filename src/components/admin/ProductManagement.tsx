import React, { useState, useEffect } from 'react';
import { productApi } from '../../api/services';
import { Product } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Tag } from 'lucide-react';

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
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Product Catalog &amp; Variants
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Configure software base prices, brand edition markups (+$560 Odoo adder), and recurring add-ons.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
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
            <BentoCard key={prod.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5ECEC] text-xs">
                  <span className="font-mono font-semibold text-[#345C64] capitalize">{prod.type}</span>
                  <span className="text-[#56666B] font-mono">Unit Cost: ${prod.costPrice}</span>
                </div>

                <h3 className="text-base font-bold text-[#252B2E] font-display mt-3">{prod.name}</h3>
                <p className="text-xs text-[#56666B] mt-1 leading-relaxed">{prod.description}</p>

                {/* Primary Teal (#345C64) Effective Price Anchor */}
                <div className="mt-4 p-4 rounded-xl bg-[#345C64] text-white flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-[#DDF3F0] block">Effective Sales Price</span>
                    <span className="text-2xl font-extrabold font-mono text-white">
                      ${dynamicEffectivePrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#8CE6DB]">
                    {margin}% Gross Margin
                  </span>
                </div>

                {/* Variants List & Interactive Selector */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#56666B]">
                    <span className="font-medium">Configured Variants ({prod.variants.length})</span>
                    <button
                      onClick={() => setSelectedProductForVariant(prod)}
                      className="text-[#1F3F47] hover:text-[#2E9F92] font-semibold text-xs"
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
                        className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                          activeVarIdx === idx
                            ? 'bg-[#DDF3F0] border-[#1F3F47] text-[#1F3F47]'
                            : 'bg-[#F7FAFA] border-[#E5ECEC] text-[#252B2E] hover:border-[#345C64]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-[#345C64]" />
                          <span className="font-semibold">{v.name}</span>
                        </div>
                        <span className="font-mono text-[#2E9F92] font-bold">
                          {v.additionalPrice > 0 ? `+$${v.additionalPrice}` : 'Base Price'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {prod.notes && (
                <div className="mt-4 pt-3 border-t border-[#E5ECEC] text-[11px] text-[#56666B]">
                  {prod.notes}
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
        subtitle="Define base software or recurring add-on product offering"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Brightloop ERP Core"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Product Type</label>
              <select
                value={productForm.type}
                onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                <option value="software">Software</option>
                <option value="service">Service / SLA</option>
                <option value="addon">Add-On</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Base Sales Price ($)</label>
              <input
                type="number"
                required
                value={productForm.salesPrice}
                onChange={(e) => setProductForm({ ...productForm, salesPrice: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Cost Price ($)</label>
              <input
                type="number"
                required
                value={productForm.costPrice}
                onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Description</label>
            <textarea
              rows={2}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Product capabilities and subscription scope..."
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Internal Operations Notes</label>
            <input
              type="text"
              value={productForm.notes}
              onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
              placeholder="e.g. Included in enterprise ecosystem tier"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5ECEC]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold"
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
          subtitle="Configure edition pricing markup (e.g. Odoo Brand +$560)"
        >
          <form onSubmit={handleAddVariant} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Variant Name *</label>
              <input
                type="text"
                required
                value={variantForm.name}
                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                placeholder="e.g. Odoo Brand Edition"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Additional Price ($) *</label>
                <input
                  type="number"
                  required
                  value={variantForm.additionalPrice}
                  onChange={(e) => setVariantForm({ ...variantForm, additionalPrice: Number(e.target.value) })}
                  placeholder="560"
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">SKU / Code</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="BMS-ODOO-560"
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#345C64] text-white text-xs flex justify-between items-center">
              <div>
                <span className="text-[#DDF3F0]">Total Customer Price:</span>
                <div className="text-base font-bold font-mono text-white">
                  ${(selectedProductForVariant.salesPrice + Number(variantForm.additionalPrice)).toLocaleString()}
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#DDF3F0]">
                Base ${selectedProductForVariant.salesPrice} + Adder ${variantForm.additionalPrice}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E5ECEC]">
              <button
                type="button"
                onClick={() => setSelectedProductForVariant(null)}
                className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold"
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
