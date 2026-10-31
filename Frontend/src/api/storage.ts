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
  DunningEvent
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_QUOTATIONS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_DISCOUNTS,
  INITIAL_TAXES,
  INITIAL_BILLING_RUNS,
  INITIAL_DUNNING_EVENTS
} from '../data/mockData';

const STORAGE_KEYS = {
  CUSTOMERS: 'brightloop_customers',
  PRODUCTS: 'brightloop_products',
  PLANS: 'brightloop_plans',
  QUOTATIONS: 'brightloop_quotations',
  SUBSCRIPTIONS: 'brightloop_subscriptions',
  INVOICES: 'brightloop_invoices',
  PAYMENTS: 'brightloop_payments',
  DISCOUNTS: 'brightloop_discounts',
  TAXES: 'brightloop_taxes',
  BILLING_RUNS: 'brightloop_billing_runs',
  DUNNING: 'brightloop_dunning'
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStore = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  listeners.forEach((l) => l());
};

function getOrInit<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage save failed:', err);
  }
  notify();
}

export const store = {
  getCustomers: (): Customer[] => getOrInit(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (data: Customer[]) => save(STORAGE_KEYS.CUSTOMERS, data),

  getProducts: (): Product[] => getOrInit(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (data: Product[]) => save(STORAGE_KEYS.PRODUCTS, data),

  getPlans: (): SubscriptionPlan[] => getOrInit(STORAGE_KEYS.PLANS, INITIAL_PLANS),
  savePlans: (data: SubscriptionPlan[]) => save(STORAGE_KEYS.PLANS, data),

  getQuotations: (): Quotation[] => getOrInit(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS),
  saveQuotations: (data: Quotation[]) => save(STORAGE_KEYS.QUOTATIONS, data),

  getSubscriptions: (): Subscription[] => getOrInit(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS),
  saveSubscriptions: (data: Subscription[]) => save(STORAGE_KEYS.SUBSCRIPTIONS, data),

  getInvoices: (): Invoice[] => getOrInit(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoices: (data: Invoice[]) => save(STORAGE_KEYS.INVOICES, data),

  getPayments: (): Payment[] => getOrInit(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
  savePayments: (data: Payment[]) => save(STORAGE_KEYS.PAYMENTS, data),

  getDiscounts: (): DiscountRule[] => getOrInit(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS),
  saveDiscounts: (data: DiscountRule[]) => save(STORAGE_KEYS.DISCOUNTS, data),

  getTaxes: (): TaxRule[] => getOrInit(STORAGE_KEYS.TAXES, INITIAL_TAXES),
  saveTaxes: (data: TaxRule[]) => save(STORAGE_KEYS.TAXES, data),

  getBillingRuns: (): BillingRun[] => getOrInit(STORAGE_KEYS.BILLING_RUNS, INITIAL_BILLING_RUNS),
  saveBillingRuns: (data: BillingRun[]) => save(STORAGE_KEYS.BILLING_RUNS, data),

  getDunningEvents: (): DunningEvent[] => getOrInit(STORAGE_KEYS.DUNNING, INITIAL_DUNNING_EVENTS),
  saveDunningEvents: (data: DunningEvent[]) => save(STORAGE_KEYS.DUNNING, data),

  resetToDefaults: () => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(INITIAL_DISCOUNTS));
    localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(INITIAL_TAXES));
    localStorage.setItem(STORAGE_KEYS.BILLING_RUNS, JSON.stringify(INITIAL_BILLING_RUNS));
    localStorage.setItem(STORAGE_KEYS.DUNNING, JSON.stringify(INITIAL_DUNNING_EVENTS));
    notify();
  }
};
