export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  customerId?: string; // If customer role
  company?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  billingAddress: string;
  country: string;
  taxId: string;
  status: 'active' | 'inactive';
  activeSubscriptionsCount: number;
  outstandingBalance: number;
  totalRevenue: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Standard", "Odoo Brand Edition", "Enterprise Dedicated"
  additionalPrice: number; // e.g. 0, 560, 1200
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'software' | 'service' | 'addon';
  salesPrice: number;
  costPrice: number;
  description: string;
  notes: string;
  variants: ProductVariant[];
  status: 'active' | 'archived';
  createdAt: string;
}

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  productId: string;
  billingInterval: BillingInterval;
  intervalCount: number; // usually 1 (e.g. 1 month)
  price: number;
  minimumQuantity: number;
  startDate: string;
  endDate?: string;
  autoCloseOnEnd: boolean;
  allowEarlyCancel: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  description: string;
  status: 'active' | 'archived';
  subscriptionCount?: number;
}

export interface PlanRecommendation extends SubscriptionPlan {
  popularityCount: number;
  customerCount: number;
  recommendationScore: number;
  recommendationReasons: string[];
}

export interface SubscriptionOptimizationRecommendation {
  subscriptionId: string;
  subscriptionNumber: string;
  currentPlanId: string;
  currentPlanName: string;
  alternativePlanId: string;
  alternativePlanName: string;
  action: 'upgrade' | 'downgrade' | 'review_unused_subscription';
  confidence?: number;
  currentMonthlyCost: number;
  alternativeMonthlyCost: number;
}

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 18 for 18%
  taxAmount: number;
  discountAmount: number;
  subtotal: number;
  total: number;
}

export type QuotationStatus = 'draft' | 'quotation' | 'confirmed' | 'converted' | 'expired' | 'cancelled';

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId?: string;
  planName?: string;
  templateId?: string;
  quotationDate: string;
  validUntil: string;
  lines: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  status: QuotationStatus;
  notes: string;
  paymentTerms: string;
  convertedSubscriptionId?: string;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  expiryDate?: string;
  paymentTerms: string;
  lines: LineItem[];
  totalAmount: number;
  autoRenew: boolean;
  pauseReason?: string;
  notes?: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId?: string;
  subscriptionNumber?: string;
  invoiceDate: string;
  dueDate: string;
  lines: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  notes?: string;
  pdfUrl?: string;
  sentDate?: string;
}

export type PaymentMethod = 'Card' | 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  paymentReference: string;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  transactionReference: string;
  notes?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

export interface DiscountRule {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 15 for 15% or 100 for $100
  minimumPurchase: number;
  minimumQuantity: number;
  applicableProductIds: string[]; // empty for all
  applicableSubscriptions: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'expired' | 'disabled';
}

export interface TaxRule {
  id: string;
  name: string;
  percentage: number;
  type: 'sales' | 'vat' | 'gst';
  applicableProductIds: string[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive';
}

export interface BillingRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  status: 'in_progress' | 'completed' | 'failed' | 'partially_failed';
  generatedInvoiceIds: string[];
  totalBilledAmount: number;
}

export interface DunningEvent {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryDate: string;
  lastFailureReason: string;
  status: 'retrying' | 'recovered' | 'churn_risk' | 'grace_period';
  recoveryStrategy: string;
}
