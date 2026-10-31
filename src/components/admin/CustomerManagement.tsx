import React, { useState, useEffect } from 'react';
import { customerApi, subscriptionApi, invoiceApi, paymentApi } from '../../api/services';
import { Customer, Subscription, Invoice, Payment } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText
} from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments' | 'activity'>('overview');

  const [custSubscriptions, setCustSubscriptions] = useState<Subscription[]>([]);
  const [custInvoices, setCustInvoices] = useState<Invoice[]>([]);
  const [custPayments, setCustPayments] = useState<Payment[]>([]);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingAddress: '',
    country: 'United States',
    taxId: '',
    status: 'active' as 'active' | 'inactive'
  });

  const loadCustomers = async () => {
    const res = await customerApi.getAll(search, statusFilter);
    if (res.success) setCustomers(res.data);
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      billingAddress: '',
      country: 'United States',
      taxId: '',
      status: 'active'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      billingAddress: c.billingAddress,
      country: c.country,
      taxId: c.taxId,
      status: c.status
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      showToast('Name, email, and company are required', { type: 'error' });
      return;
    }

    if (selectedCustomer) {
      const res = await customerApi.update(selectedCustomer.id, formData);
      if (res.success) {
        showToast(`Customer ${res.data.name} updated successfully`);
        setIsAddModalOpen(false);
        loadCustomers();
      }
    } else {
      const res = await customerApi.create(formData);
      if (res.success) {
        showToast(`Customer ${res.data.name} registered successfully`);
        setIsAddModalOpen(false);
        loadCustomers();
      }
    }
  };

  const handleViewDetails = async (c: Customer) => {
    setDetailCustomer(c);
    setDetailTab('overview');
    const subsRes = await subscriptionApi.getAll();
    if (subsRes.success) setCustSubscriptions(subsRes.data.filter((s) => s.customerId === c.id));

    const invsRes = await invoiceApi.getAll();
    if (invsRes.success) setCustInvoices(invsRes.data.filter((i) => i.customerId === c.id));

    const paysRes = await paymentApi.getAll();
    if (paysRes.success) setCustPayments(paysRes.data.filter((p) => p.customerId === c.id));
  };

  const exportCSV = () => {
    const headers = ['ID,Name,Email,Company,Country,Subscriptions,Outstanding,Total Revenue,Status\n'];
    const rows = customers.map(
      (c) =>
        `"${c.id}","${c.name}","${c.email}","${c.company}","${c.country}",${c.activeSubscriptionsCount},${c.outstandingBalance},${c.totalRevenue},"${c.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop_customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Customer export CSV generated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">Customer Accounts</h1>
          <p className="text-xs text-[#56666B] mt-1">
            Enterprise accounts, active recurring profiles, billing addresses, and tax identification.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#345C64]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5ECEC]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#56666B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#56666B] font-medium">Status:</span>
          <div className="flex items-center p-0.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC]">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs capitalize rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#1F3F47] text-white font-semibold'
                    : 'text-[#56666B] hover:text-[#252B2E]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFA] text-[11px] text-[#56666B] border-b border-[#E5ECEC]">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer &amp; Company</th>
                <th className="px-4 py-3 font-semibold">Email &amp; Phone</th>
                <th className="px-4 py-3 font-semibold">Country &amp; Tax ID</th>
                <th className="px-4 py-3 font-semibold text-center">Active Subs</th>
                <th className="px-4 py-3 font-semibold text-right">Outstanding</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECEC]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#56666B]">
                    No customers found matching current filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#252B2E]">{c.name}</div>
                      <div className="text-[11px] text-[#56666B]">{c.company}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[#252B2E] font-mono text-[11px]">{c.email}</div>
                      <div className="text-[11px] text-[#56666B] font-mono">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[#252B2E]">{c.country}</div>
                      <div className="text-[11px] font-mono text-[#56666B]">{c.taxId || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#1F3F47]">
                      {c.activeSubscriptionsCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">
                      <span className={c.outstandingBalance > 0 ? 'text-[#E96F50]' : 'text-[#56666B]'}>
                        ${c.outstandingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#2E9F92]">
                      ${c.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(c)}
                          className="p-1.5 rounded-lg text-[#56666B] hover:text-[#1F3F47] hover:bg-[#DDF3F0]/60 transition-colors"
                          title="Inspect customer account"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-[#56666B] hover:text-[#1F3F47] hover:bg-[#DDF3F0]/60 transition-colors"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer Record' : 'Register New Customer'}
        subtitle="Manage billing profiles, tax codes, and contract communications."
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. sarah@apexlogistics.com"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Global Logistics"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 349-2810"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#252B2E] mb-1">Billing Address</label>
            <input
              type="text"
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="e.g. 450 Harbor Blvd, Suite 800, San Francisco, CA"
              className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Tax ID / EIN / VAT</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. US-EIN-94820194"
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#252B2E] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E5ECEC]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#E5ECEC]/50 text-[#56666B] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal with 5 Tabs */}
      {detailCustomer && (
        <Modal
          isOpen={!!detailCustomer}
          onClose={() => setDetailCustomer(null)}
          title={detailCustomer.name}
          subtitle={`${detailCustomer.company} · ${detailCustomer.country}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-1 border-b border-[#E5ECEC] pb-2 text-xs overflow-x-auto">
              {(['overview', 'subscriptions', 'invoices', 'payments', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 capitalize rounded-lg transition-colors whitespace-nowrap ${
                    detailTab === tab
                      ? 'bg-[#1F3F47] text-white font-semibold'
                      : 'text-[#56666B] hover:text-[#252B2E] hover:bg-[#F7FAFA]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {detailTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#345C64] text-white">
                    <div className="text-[#DDF3F0] text-[11px]">Total Recognized Revenue</div>
                    <div className="text-xl font-bold font-mono mt-1">
                      ${detailCustomer.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC]">
                    <div className="text-[#56666B] text-[11px]">Outstanding Receivable</div>
                    <div className="text-xl font-bold font-mono text-[#E96F50] mt-1">
                      ${detailCustomer.outstandingBalance.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC]">
                    <div className="text-[#56666B] text-[11px]">Active Subscriptions</div>
                    <div className="text-xl font-bold font-mono text-[#1F3F47] mt-1">
                      {detailCustomer.activeSubscriptionsCount}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2.5">
                  <div className="font-semibold text-[#252B2E] border-b border-[#E5ECEC] pb-2">
                    Billing &amp; Profile Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#252B2E]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#345C64]" />
                      <span className="font-mono">{detailCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#345C64]" />
                      <span className="font-mono">{detailCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#345C64]" />
                      <span>{detailCustomer.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#345C64]" />
                      <span>{detailCustomer.billingAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'subscriptions' && (
              <div className="space-y-2.5">
                {custSubscriptions.length === 0 ? (
                  <p className="text-xs text-[#56666B] py-6 text-center">No active subscriptions on file.</p>
                ) : (
                  custSubscriptions.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-[#1F3F47] font-semibold">{s.subscriptionNumber}</div>
                        <div className="text-[#56666B]">{s.planName} · Renews on {s.nextBillingDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#252B2E] font-bold">${s.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'invoices' && (
              <div className="space-y-2.5">
                {custInvoices.length === 0 ? (
                  <p className="text-xs text-[#56666B] py-6 text-center">No invoices recorded.</p>
                ) : (
                  custInvoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-[#1F3F47] font-semibold">{inv.invoiceNumber}</div>
                        <div className="text-[#56666B] font-mono">Date: {inv.invoiceDate} · Due: {inv.dueDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#252B2E] font-bold">${inv.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'payments' && (
              <div className="space-y-2.5">
                {custPayments.length === 0 ? (
                  <p className="text-xs text-[#56666B] py-6 text-center">No recorded payment transactions.</p>
                ) : (
                  custPayments.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-[#1F3F47] font-semibold">{p.paymentReference}</div>
                        <div className="text-[#56666B]">Method: {p.method} · Date: {p.paymentDate}</div>
                      </div>
                      <span className="font-mono text-[#2E9F92] font-bold">${p.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'activity' && (
              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#345C64]" />
                  <div>
                    <span className="text-[#252B2E] font-semibold">Customer Profile Initialized</span>
                    <span className="text-[#56666B] block text-[11px] font-mono">
                      Registered on {detailCustomer.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
