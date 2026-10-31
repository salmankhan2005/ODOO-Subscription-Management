import { store } from './storage';
import { delay, ApiResponse } from './axios';
import {
  Customer,
  Product,
  SubscriptionPlan,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  DiscountRule,
  TaxRule,
  BillingRun,
  DunningEvent,
  ProductVariant
} from '../types';

export const customerApi = {
  getAll: async (search = '', status = 'all'): Promise<ApiResponse<Customer[]>> => {
    await delay();
    let list = store.getCustomers();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }
    if (status !== 'all') {
      list = list.filter((c) => c.status === status);
    }
    return { data: list, success: true };
  },

  getById: async (id: string): Promise<ApiResponse<Customer | null>> => {
    await delay();
    const customer = store.getCustomers().find((c) => c.id === id) || null;
    return { data: customer, success: !!customer };
  },

  create: async (payload: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount' | 'outstandingBalance' | 'totalRevenue'>): Promise<ApiResponse<Customer>> => {
    await delay();
    const newCustomer: Customer = {
      ...payload,
      id: `cust_${Date.now()}`,
      activeSubscriptionsCount: 0,
      outstandingBalance: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const list = [newCustomer, ...store.getCustomers()];
    store.saveCustomers(list);
    return { data: newCustomer, success: true, message: 'Customer created successfully' };
  },

  update: async (id: string, payload: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    await delay();
    const list = store.getCustomers().map((c) => (c.id === id ? { ...c, ...payload } : c));
    store.saveCustomers(list);
    const updated = list.find((c) => c.id === id)!;
    return { data: updated, success: true, message: 'Customer updated successfully' };
  }
};

export const productApi = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    await delay();
    return { data: store.getProducts(), success: true };
  },

  create: async (payload: Omit<Product, 'id' | 'createdAt'>): Promise<ApiResponse<Product>> => {
    await delay();
    const newProduct: Product = {
      ...payload,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    store.saveProducts([newProduct, ...store.getProducts()]);
    return { data: newProduct, success: true, message: 'Product created' };
  },

  addVariant: async (productId: string, variant: Omit<ProductVariant, 'id'>): Promise<ApiResponse<Product>> => {
    await delay();
    const newVariant: ProductVariant = {
      ...variant,
      id: `var_${Date.now()}`
    };
    const products = store.getProducts().map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          variants: [...p.variants, newVariant]
        };
      }
      return p;
    });
    store.saveProducts(products);
    const updated = products.find((p) => p.id === productId)!;
    return { data: updated, success: true, message: 'Variant added' };
  }
};

export const planApi = {
  getAll: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    await delay();
    return { data: store.getPlans(), success: true };
  },

  create: async (payload: Omit<SubscriptionPlan, 'id'>): Promise<ApiResponse<SubscriptionPlan>> => {
    await delay();
    const newPlan: SubscriptionPlan = {
      ...payload,
      id: `plan_${Date.now()}`,
      subscriptionCount: 0
    };
    store.savePlans([newPlan, ...store.getPlans()]);
    return { data: newPlan, success: true, message: 'Plan created successfully' };
  }
};

export const quotationApi = {
  getAll: async (): Promise<ApiResponse<Quotation[]>> => {
    await delay();
    return { data: store.getQuotations(), success: true };
  },

  create: async (payload: Omit<Quotation, 'id' | 'quotationNumber'>): Promise<ApiResponse<Quotation>> => {
    await delay();
    const count = store.getQuotations().length + 43;
    const newQuote: Quotation = {
      ...payload,
      id: `quote_${Date.now()}`,
      quotationNumber: `QT-2026-${String(count).padStart(4, '0')}`
    };
    store.saveQuotations([newQuote, ...store.getQuotations()]);
    return { data: newQuote, success: true, message: 'Quotation created' };
  },

  updateStatus: async (id: string, status: Quotation['status']): Promise<ApiResponse<Quotation>> => {
    await delay();
    const quotes = store.getQuotations().map((q) => (q.id === id ? { ...q, status } : q));
    store.saveQuotations(quotes);
    return { data: quotes.find((q) => q.id === id)!, success: true, message: `Status updated to ${status}` };
  },

  convertToSubscription: async (quoteId: string): Promise<ApiResponse<Subscription>> => {
    await delay();
    const quote = store.getQuotations().find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quotation not found');

    const subNumber = `SUB-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      subscriptionNumber: subNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      planId: quote.planId || 'plan_bms_monthly',
      planName: quote.planName || 'Business Software Pro (Monthly)',
      billingInterval: 'monthly',
      status: 'active',
      startDate: today,
      nextBillingDate: nextMonth,
      expiryDate: nextYear,
      paymentTerms: quote.paymentTerms || 'Due on receipt',
      lines: quote.lines,
      totalAmount: quote.totalAmount,
      autoRenew: true,
      createdAt: today
    };

    // Save subscription
    store.saveSubscriptions([newSub, ...store.getSubscriptions()]);

    // Mark quote as converted
    const quotes = store.getQuotations().map((q) =>
      q.id === quoteId ? { ...q, status: 'converted' as const, convertedSubscriptionId: newSub.id } : q
    );
    store.saveQuotations(quotes);

    // Update customer active subscription count
    const customers = store.getCustomers().map((c) =>
      c.id === quote.customerId ? { ...c, activeSubscriptionsCount: c.activeSubscriptionsCount + 1 } : c
    );
    store.saveCustomers(customers);

    // Generate initial invoice for subscription
    const invCount = store.getInvoices().length + 1052;
    const initialInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-2026-${invCount}`,
      customerId: newSub.customerId,
      customerName: newSub.customerName,
      customerEmail: newSub.customerEmail,
      subscriptionId: newSub.id,
      subscriptionNumber: newSub.subscriptionNumber,
      invoiceDate: today,
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      lines: newSub.lines,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxTotal: quote.taxTotal,
      totalAmount: quote.totalAmount,
      amountPaid: 0,
      outstandingBalance: quote.totalAmount,
      status: 'confirmed',
      sentDate: today
    };
    store.saveInvoices([initialInvoice, ...store.getInvoices()]);

    return { data: newSub, success: true, message: 'Converted into active subscription & invoice generated' };
  }
};

export const subscriptionApi = {
  getAll: async (status = 'all'): Promise<ApiResponse<Subscription[]>> => {
    await delay();
    let subs = store.getSubscriptions();
    if (status !== 'all') {
      subs = subs.filter((s) => s.status === status);
    }
    return { data: subs, success: true };
  },

  getById: async (id: string): Promise<ApiResponse<Subscription | null>> => {
    await delay();
    const sub = store.getSubscriptions().find((s) => s.id === id) || null;
    return { data: sub, success: !!sub };
  },

  create: async (payload: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt'>): Promise<ApiResponse<Subscription>> => {
    await delay();
    const count = store.getSubscriptions().length + 8804;
    const newSub: Subscription = {
      ...payload,
      id: `sub_${Date.now()}`,
      subscriptionNumber: `SUB-2026-${count}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    store.saveSubscriptions([newSub, ...store.getSubscriptions()]);

    if (newSub.status === 'active') {
      const customers = store.getCustomers().map((c) =>
        c.id === newSub.customerId ? { ...c, activeSubscriptionsCount: c.activeSubscriptionsCount + 1 } : c
      );
      store.saveCustomers(customers);
    }

    return { data: newSub, success: true, message: 'Subscription created' };
  },

  updateStatus: async (
    id: string,
    status: Subscription['status'],
    pauseReason?: string
  ): Promise<ApiResponse<Subscription>> => {
    await delay();
    let targetSub: Subscription | undefined;
    const subs = store.getSubscriptions().map((s) => {
      if (s.id === id) {
        targetSub = { ...s, status, pauseReason: pauseReason || s.pauseReason };
        return targetSub;
      }
      return s;
    });
    store.saveSubscriptions(subs);

    // Sync customer count
    if (targetSub) {
      const activeCount = subs.filter((s) => s.customerId === targetSub!.customerId && s.status === 'active').length;
      const customers = store.getCustomers().map((c) =>
        c.id === targetSub!.customerId ? { ...c, activeSubscriptionsCount: activeCount } : c
      );
      store.saveCustomers(customers);
    }

    return { data: targetSub!, success: true, message: `Subscription is now ${status}` };
  }
};

export const invoiceApi = {
  getAll: async (status = 'all'): Promise<ApiResponse<Invoice[]>> => {
    await delay();
    let invs = store.getInvoices();
    if (status !== 'all') {
      invs = invs.filter((i) => i.status === status);
    }
    return { data: invs, success: true };
  },

  getById: async (id: string): Promise<ApiResponse<Invoice | null>> => {
    await delay();
    const inv = store.getInvoices().find((i) => i.id === id) || null;
    return { data: inv, success: !!inv };
  },

  updateStatus: async (id: string, status: Invoice['status']): Promise<ApiResponse<Invoice>> => {
    await delay();
    const invs = store.getInvoices().map((i) => (i.id === id ? { ...i, status } : i));
    store.saveInvoices(invs);
    return { data: invs.find((i) => i.id === id)!, success: true };
  },

  sendInvoice: async (id: string): Promise<ApiResponse<Invoice>> => {
    await delay();
    const today = new Date().toISOString().split('T')[0];
    const invs = store.getInvoices().map((i) =>
      i.id === id ? { ...i, sentDate: today, status: i.status === 'draft' ? ('confirmed' as const) : i.status } : i
    );
    store.saveInvoices(invs);
    return { data: invs.find((i) => i.id === id)!, success: true, message: 'Invoice dispatched to customer email' };
  }
};

export const paymentApi = {
  getAll: async (): Promise<ApiResponse<Payment[]>> => {
    await delay();
    return { data: store.getPayments(), success: true };
  },

  record: async (payload: {
    invoiceId: string;
    method: Payment['method'];
    amount: number;
    transactionReference: string;
    notes?: string;
  }): Promise<ApiResponse<Payment>> => {
    await delay();
    const invoice = store.getInvoices().find((i) => i.id === payload.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const paymentNumber = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      paymentReference: paymentNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      method: payload.method,
      amount: payload.amount,
      paymentDate: today,
      transactionReference: payload.transactionReference,
      notes: payload.notes,
      status: 'completed'
    };

    // Update payment list
    store.savePayments([newPayment, ...store.getPayments()]);

    // Update invoice paid & balance
    const newAmountPaid = invoice.amountPaid + payload.amount;
    const newOutstanding = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus: Invoice['status'] =
      newOutstanding <= 0.01 ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : invoice.status;

    const invoices = store.getInvoices().map((i) =>
      i.id === invoice.id
        ? {
            ...i,
            amountPaid: newAmountPaid,
            outstandingBalance: newOutstanding,
            status: newStatus
          }
        : i
    );
    store.saveInvoices(invoices);

    // Update customer revenue & balance
    const customers = store.getCustomers().map((c) => {
      if (c.id === invoice.customerId) {
        return {
          ...c,
          totalRevenue: c.totalRevenue + payload.amount,
          outstandingBalance: Math.max(0, c.outstandingBalance - payload.amount)
        };
      }
      return c;
    });
    store.saveCustomers(customers);

    return { data: newPayment, success: true, message: `Payment of $${payload.amount} recorded successfully` };
  }
};

export const discountApi = {
  getAll: async (): Promise<ApiResponse<DiscountRule[]>> => {
    await delay();
    return { data: store.getDiscounts(), success: true };
  },

  create: async (payload: Omit<DiscountRule, 'id' | 'usageCount'>): Promise<ApiResponse<DiscountRule>> => {
    await delay();
    const newDisc: DiscountRule = {
      ...payload,
      id: `disc_${Date.now()}`,
      usageCount: 0
    };
    store.saveDiscounts([newDisc, ...store.getDiscounts()]);
    return { data: newDisc, success: true, message: 'Discount rule activated' };
  }
};

export const taxApi = {
  getAll: async (): Promise<ApiResponse<TaxRule[]>> => {
    await delay();
    return { data: store.getTaxes(), success: true };
  },

  create: async (payload: Omit<TaxRule, 'id'>): Promise<ApiResponse<TaxRule>> => {
    await delay();
    const newTax: TaxRule = {
      ...payload,
      id: `tax_${Date.now()}`
    };
    store.saveTaxes([newTax, ...store.getTaxes()]);
    return { data: newTax, success: true, message: 'Tax rule configured' };
  }
};

export const billingApi = {
  getRuns: async (): Promise<ApiResponse<BillingRun[]>> => {
    await delay();
    return { data: store.getBillingRuns(), success: true };
  },

  getDunningEvents: async (): Promise<ApiResponse<DunningEvent[]>> => {
    await delay();
    return { data: store.getDunningEvents(), success: true };
  },

  previewDueSubscriptions: async (): Promise<ApiResponse<Subscription[]>> => {
    await delay();
    // Subscriptions due for billing
    const activeSubs = store.getSubscriptions().filter((s) => s.status === 'active');
    return { data: activeSubs, success: true };
  },

  runBillingBatch: async (): Promise<ApiResponse<BillingRun>> => {
    // Simulates billing run for active subscriptions
    await delay(150);
    const activeSubs = store.getSubscriptions().filter((s) => s.status === 'active');
    const today = new Date().toISOString().split('T')[0];
    const generatedInvoiceIds: string[] = [];
    let totalBilled = 0;

    const existingInvoices = store.getInvoices();
    let currentMaxNumber = existingInvoices.length + 1055;

    const newInvoices: Invoice[] = activeSubs.map((sub) => {
      currentMaxNumber += 1;
      const invId = `inv_batch_${Date.now()}_${sub.id}`;
      generatedInvoiceIds.push(invId);
      totalBilled += sub.totalAmount;

      return {
        id: invId,
        invoiceNumber: `INV-2026-${currentMaxNumber}`,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        invoiceDate: today,
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        lines: sub.lines,
        subtotal: sub.totalAmount / 1.18, // approximate before tax
        discountTotal: 0,
        taxTotal: sub.totalAmount - sub.totalAmount / 1.18,
        totalAmount: sub.totalAmount,
        amountPaid: 0,
        outstandingBalance: sub.totalAmount,
        status: 'confirmed',
        sentDate: today
      };
    });

    store.saveInvoices([...newInvoices, ...existingInvoices]);

    const runId = `run_${Date.now()}`;
    const newRun: BillingRun = {
      id: runId,
      startedAt: `${today} ${new Date().toTimeString().split(' ')[0]}`,
      completedAt: `${today} ${new Date(Date.now() + 4000).toTimeString().split(' ')[0]}`,
      totalProcessed: activeSubs.length,
      successful: activeSubs.length,
      failed: 0,
      status: 'completed',
      generatedInvoiceIds,
      totalBilledAmount: totalBilled
    };

    store.saveBillingRuns([newRun, ...store.getBillingRuns()]);

    return {
      data: newRun,
      success: true,
      message: `Batch completed: ${activeSubs.length} invoices generated successfully.`
    };
  },

  retryDunning: async (dunningId: string): Promise<ApiResponse<DunningEvent>> => {
    await delay(120);
    const events = store.getDunningEvents().map((e) => {
      if (e.id === dunningId) {
        return {
          ...e,
          status: 'recovered' as const,
          recoveryStrategy: 'Recovered via fallback secondary payment rail (ACH Wire capture)'
        };
      }
      return e;
    });
    store.saveDunningEvents(events);
    const updated = events.find((e) => e.id === dunningId)!;
    return { data: updated, success: true, message: 'Dunning recovery executed successfully!' };
  }
};

export const reportApi = {
  getFinancialSummary: async () => {
    await delay();
    const subs = store.getSubscriptions();
    const invoices = store.getInvoices();
    const customers = store.getCustomers();

    const activeSubs = subs.filter((s) => s.status === 'active');
    const mrr = activeSubs.reduce((acc, s) => {
      if (s.billingInterval === 'yearly') return acc + s.totalAmount / 12;
      return acc + s.totalAmount;
    }, 0);
    const arr = mrr * 12;

    const totalCollected = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
    const totalOutstanding = invoices.reduce((acc, i) => acc + (i.outstandingBalance || 0), 0);
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);

    return {
      data: {
        mrr,
        arr,
        activeSubscriptionsCount: activeSubs.length,
        totalCustomersCount: customers.length,
        totalCollected,
        totalOutstanding,
        overdueCount: overdueInvoices.length,
        overdueAmount,
        upcomingRenewalsCount: activeSubs.length
      },
      success: true
    };
  }
};

export const portalApi = {
  getCustomerData: async (customerId: string) => {
    await delay();
    const customer = store.getCustomers().find((c) => c.id === customerId);
    const subscriptions = store.getSubscriptions().filter((s) => s.customerId === customerId);
    const invoices = store.getInvoices().filter((i) => i.customerId === customerId);
    const payments = store.getPayments().filter((p) => p.customerId === customerId);
    const availablePlans = store.getPlans().filter((p) => p.status === 'active');

    return {
      data: {
        customer,
        subscriptions,
        invoices,
        payments,
        availablePlans
      },
      success: true
    };
  }
};
