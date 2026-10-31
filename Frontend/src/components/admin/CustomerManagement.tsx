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

  // Related data for customer detail drawer
  const [custSubscriptions, setCustSubscriptions] = useState<Subscription[]>([]);
  const [custInvoices, setCustInvoices] = useState<Invoice[]>([]);
  const [custPayments, setCustPayments] = useState<Payment[]>([]);

  const { showToast } = useToast();

  // Form state
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
    try {
      const res = await customerApi.getAll({ search, status: statusFilter });
      if (res.success) setCustomers(res.data);
    } catch (error) {
      showToast('Could not load customers', {
        type: 'error',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Customer Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounts, active recurring profiles, billing addresses, and tax identification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400">Status:</span>
          <div className="flex items-center p-0.5 rounded-lg bg-slate-800/80">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs capitalize rounded-md transition-colors ${
                  statusFilter === st ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Data Table BentoCard */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer & Company</th>
                <th className="px-4 py-3 font-semibold">Email & Phone</th>
                <th className="px-4 py-3 font-semibold">Country & Tax ID</th>
                <th className="px-4 py-3 font-semibold text-center">Active Subs</th>
                <th className="px-4 py-3 font-semibold text-right">Outstanding</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No customers found matching current filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-100">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.company}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-300 font-mono text-[11px]">{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200">{c.country}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.taxId || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-indigo-400">
                      {c.activeSubscriptionsCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">
                      <span className={(c.outstandingBalance ?? 0) > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        ${Number(c.outstandingBalance ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-400">
                      ${Number(c.totalRevenue ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(c)}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          title="View customer tabs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
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
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. sarah@apexlogistics.com"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Global Logistics"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 349-2810"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Billing Address</label>
            <input
              type="text"
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="e.g. 450 Harbor Blvd, Suite 800, San Francisco, CA"
              className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tax ID / EIN / VAT</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. US-EIN-94820194"
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
              {(['overview', 'subscriptions', 'invoices', 'payments', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 capitalize rounded-lg transition-colors ${
                    detailTab === tab
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {detailTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Total Recognized Revenue</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      ${detailCustomer.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Outstanding Receivable</div>
                    <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                      ${detailCustomer.outstandingBalance.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Active Subscriptions</div>
                    <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                      {detailCustomer.activeSubscriptionsCount}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                    Billing & Profile Information
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{detailCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{detailCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{detailCustomer.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{detailCustomer.billingAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Subscriptions */}
            {detailTab === 'subscriptions' && (
              <div className="space-y-3">
                {custSubscriptions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No active subscriptions on file.</p>
                ) : (
                  custSubscriptions.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-slate-200 font-semibold">{s.subscriptionNumber}</div>
                        <div className="text-slate-400">{s.planName} · Renews on {s.nextBillingDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-100 font-semibold">${s.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={s.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Invoices */}
            {detailTab === 'invoices' && (
              <div className="space-y-3">
                {custInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No invoices recorded.</p>
                ) : (
                  custInvoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-slate-200 font-semibold">{inv.invoiceNumber}</div>
                        <div className="text-slate-400">Date: {inv.invoiceDate} · Due: {inv.dueDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-100 font-semibold">${inv.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Payments */}
            {detailTab === 'payments' && (
              <div className="space-y-3">
                {custPayments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No recorded payment transactions.</p>
                ) : (
                  custPayments.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono text-slate-200 font-semibold">{p.paymentReference}</div>
                        <div className="text-slate-400">Method: {p.method} · Date: {p.paymentDate}</div>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold">${p.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 5: Activity */}
            {detailTab === 'activity' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-slate-200 font-medium">Customer Profile Initialized</span>
                    <span className="text-slate-500 block text-[11px]">System registration on {detailCustomer.createdAt}</span>
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
