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
  User
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'David Vance (Admin)',
    email: 'admin@brightloop.io',
    role: 'admin',
    company: 'Brightloop Software Corp.'
  },
  {
    id: 'usr_staff',
    name: 'Jessica Reynolds (Sales Lead)',
    email: 'jessica@brightloop.io',
    role: 'staff',
    company: 'Brightloop Software Corp.'
  },
  {
    id: 'usr_customer',
    name: 'Sarah Jenkins (Subscriber)',
    email: 'sarah@apexlogistics.com',
    role: 'customer',
    customerId: 'cust_1',
    company: 'Apex Global Logistics'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Business Management Software',
    type: 'software',
    salesPrice: 1200,
    costPrice: 400,
    description: 'All-in-one ERP and operational core for scaling organizations.',
    notes: 'Primary revenue engine. Supports modular variants and brand adders.',
    status: 'active',
    createdAt: '2026-01-15',
    variants: [
      { id: 'var_std', name: 'Standard Edition', additionalPrice: 0, sku: 'BMS-STD' },
      { id: 'var_odoo', name: 'Odoo Brand Edition', additionalPrice: 560, sku: 'BMS-ODOO-560' },
      { id: 'var_ent', name: 'Enterprise Dedicated Cluster', additionalPrice: 1450, sku: 'BMS-ENT-1450' }
    ]
  },
  {
    id: 'prod_2',
    name: 'Automated Dunning & Billing Engine',
    type: 'addon',
    salesPrice: 380,
    costPrice: 90,
    description: 'AI-driven payment retry cascades, smart grace period dunning, and invoice routing.',
    notes: 'High margin subscription add-on with 94.2% recovery efficiency.',
    status: 'active',
    createdAt: '2026-02-01',
    variants: [
      { id: 'var_dun_std', name: 'Rules-Based Retries', additionalPrice: 0, sku: 'DUN-STD' },
      { id: 'var_dun_ai', name: 'Neural Dunning & Churn Predictor', additionalPrice: 220, sku: 'DUN-AI-220' }
    ]
  },
  {
    id: 'prod_3',
    name: 'Priority SLA & Concierge Onboarding',
    type: 'service',
    salesPrice: 650,
    costPrice: 200,
    description: 'Dedicated technical account manager with 15-minute guaranteed response time.',
    notes: 'Billed monthly alongside core platform instances.',
    status: 'active',
    createdAt: '2026-02-10',
    variants: [
      { id: 'var_sla_999', name: '99.9% Uptime SLA', additionalPrice: 0, sku: 'SLA-CORE' },
      { id: 'var_sla_247', name: '24/7 Dedicated Slack Bridge', additionalPrice: 350, sku: 'SLA-247' }
    ]
  }
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_bms_monthly',
    name: 'Business Software Pro (Monthly)',
    productId: 'prod_1',
    billingInterval: 'monthly',
    intervalCount: 1,
    price: 1200,
    minimumQuantity: 1,
    startDate: '2026-01-01',
    autoCloseOnEnd: false,
    allowEarlyCancel: true,
    allowPause: true,
    allowRenewal: true,
    description: 'Standard monthly billing for growing teams. Flexible cancellation.',
    status: 'active',
    subscriptionCount: 42
  },
  {
    id: 'plan_bms_yearly',
    name: 'Business Software Enterprise (Annual)',
    productId: 'prod_1',
    billingInterval: 'yearly',
    intervalCount: 1,
    price: 12000,
    minimumQuantity: 3,
    startDate: '2026-01-01',
    autoCloseOnEnd: true,
    allowEarlyCancel: false,
    allowPause: true,
    allowRenewal: true,
    description: 'Annual contract with locked discounted pricing and priority cluster.',
    status: 'active',
    subscriptionCount: 18
  },
  {
    id: 'plan_dunning_monthly',
    name: 'Autonomous Dunning Studio (Monthly)',
    productId: 'prod_2',
    billingInterval: 'monthly',
    intervalCount: 1,
    price: 380,
    minimumQuantity: 1,
    startDate: '2026-02-01',
    autoCloseOnEnd: false,
    allowEarlyCancel: true,
    allowPause: true,
    allowRenewal: true,
    description: 'Autonomous payment recovery and churn telemetry.',
    status: 'active',
    subscriptionCount: 29
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Sarah Jenkins',
    email: 'sarah@apexlogistics.com',
    phone: '+1 (555) 349-2810',
    company: 'Apex Global Logistics',
    billingAddress: '450 Harbor Boulevard, Suite 800, San Francisco, CA',
    country: 'United States',
    taxId: 'US-EIN-94820194',
    status: 'active',
    activeSubscriptionsCount: 2,
    outstandingBalance: 0,
    totalRevenue: 24800,
    createdAt: '2026-01-18'
  },
  {
    id: 'cust_2',
    name: 'Marcus Chen',
    email: 'marcus@nexuscloud.io',
    phone: '+1 (555) 782-9912',
    company: 'Nexus Cloud Dynamics',
    billingAddress: '120 Tech Drive, Floor 4, Austin, TX',
    country: 'United States',
    taxId: 'US-EIN-88129401',
    status: 'active',
    activeSubscriptionsCount: 1,
    outstandingBalance: 1760,
    totalRevenue: 15400,
    createdAt: '2026-02-05'
  },
  {
    id: 'cust_3',
    name: 'Elena Rostova',
    email: 'elena@luminacreative.com',
    phone: '+44 20 7946 0921',
    company: 'Lumina Creative Labs',
    billingAddress: '14 Soho Square, London W1D 3QG',
    country: 'United Kingdom',
    taxId: 'GB-VAT-920194012',
    status: 'active',
    activeSubscriptionsCount: 1,
    outstandingBalance: 0,
    totalRevenue: 8200,
    createdAt: '2026-02-22'
  },
  {
    id: 'cust_4',
    name: 'Amira Patel',
    email: 'amira@stellarretail.com',
    phone: '+91 98200 44102',
    company: 'Stellar Retail Systems',
    billingAddress: 'Bandra Kurla Complex, Mumbai 400051',
    country: 'India',
    taxId: 'IN-GST-27AABCS1429B1Z0',
    status: 'active',
    activeSubscriptionsCount: 0,
    outstandingBalance: 650,
    totalRevenue: 5400,
    createdAt: '2026-03-01'
  }
];

export const INITIAL_TAXES: TaxRule[] = [
  {
    id: 'tax_gst_18',
    name: 'Standard GST / VAT (18%)',
    percentage: 18,
    type: 'gst',
    applicableProductIds: [],
    startDate: '2026-01-01',
    status: 'active'
  },
  {
    id: 'tax_software_10',
    name: 'Software Export Surcharge (10%)',
    percentage: 10,
    type: 'vat',
    applicableProductIds: ['prod_1'],
    startDate: '2026-01-01',
    status: 'active'
  }
];

export const INITIAL_DISCOUNTS: DiscountRule[] = [
  {
    id: 'disc_early_15',
    name: 'Early Customer Incentive (15% Off)',
    code: 'BRIGHT15',
    type: 'percentage',
    value: 15,
    minimumPurchase: 500,
    minimumQuantity: 1,
    applicableProductIds: [],
    applicableSubscriptions: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageCount: 14,
    maxUsage: 100,
    status: 'active'
  },
  {
    id: 'disc_odoo_tier',
    name: 'Odoo Migration Rebate ($500 Flat)',
    code: 'MIGRATE500',
    type: 'fixed',
    value: 500,
    minimumPurchase: 1500,
    minimumQuantity: 1,
    applicableProductIds: ['prod_1'],
    applicableSubscriptions: true,
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    usageCount: 6,
    maxUsage: 25,
    status: 'active'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote_1001',
    quotationNumber: 'QT-2026-0042',
    customerId: 'cust_2',
    customerName: 'Marcus Chen',
    customerEmail: 'marcus@nexuscloud.io',
    planId: 'plan_bms_monthly',
    planName: 'Business Software Pro (Monthly)',
    templateId: 'tpl_std_quote',
    quotationDate: '2026-03-20',
    validUntil: '2026-04-15',
    lines: [
      {
        id: 'line_q1',
        productId: 'prod_1',
        productName: 'Business Management Software',
        variantId: 'var_odoo',
        variantName: 'Odoo Brand Edition (+560)',
        quantity: 1,
        unitPrice: 1760, // 1200 + 560
        taxRate: 18,
        taxAmount: 316.8,
        discountAmount: 0,
        subtotal: 1760,
        total: 2076.8
      },
      {
        id: 'line_q2',
        productId: 'prod_2',
        productName: 'Automated Dunning & Billing Engine',
        variantId: 'var_dun_ai',
        variantName: 'Neural Dunning & Churn Predictor (+220)',
        quantity: 1,
        unitPrice: 600, // 380 + 220
        taxRate: 18,
        taxAmount: 108,
        discountAmount: 0,
        subtotal: 600,
        total: 708
      }
    ],
    subtotal: 2360,
    taxTotal: 424.8,
    discountTotal: 0,
    totalAmount: 2784.8,
    status: 'confirmed',
    notes: 'Custom deployment with Odoo brand synchronization layer.',
    paymentTerms: 'Net 30 Days'
  },
  {
    id: 'quote_1002',
    quotationNumber: 'QT-2026-0043',
    customerId: 'cust_3',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@luminacreative.com',
    planId: 'plan_bms_yearly',
    planName: 'Business Software Enterprise (Annual)',
    quotationDate: '2026-03-24',
    validUntil: '2026-04-20',
    lines: [
      {
        id: 'line_q3',
        productId: 'prod_1',
        productName: 'Business Management Software',
        variantId: 'var_std',
        variantName: 'Standard Edition',
        quantity: 1,
        unitPrice: 12000,
        taxRate: 18,
        taxAmount: 2160,
        discountAmount: 500,
        subtotal: 12000,
        total: 13660
      }
    ],
    subtotal: 12000,
    taxTotal: 2160,
    discountTotal: 500,
    totalAmount: 13660,
    status: 'quotation',
    notes: 'Draft quotation for annual enterprise migration.',
    paymentTerms: 'Immediate upon confirmation'
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_201',
    subscriptionNumber: 'SUB-2026-8801',
    customerId: 'cust_1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@apexlogistics.com',
    planId: 'plan_bms_monthly',
    planName: 'Business Software Pro (Monthly)',
    billingInterval: 'monthly',
    status: 'active',
    startDate: '2026-01-20',
    nextBillingDate: '2026-11-20',
    expiryDate: '2027-01-20',
    paymentTerms: 'Due on receipt',
    autoRenew: true,
    totalAmount: 1760, // With Odoo variant
    createdAt: '2026-01-20',
    lines: [
      {
        id: 'subline_1',
        productId: 'prod_1',
        productName: 'Business Management Software',
        variantId: 'var_odoo',
        variantName: 'Odoo Brand Edition (+560)',
        quantity: 1,
        unitPrice: 1760,
        taxRate: 18,
        taxAmount: 316.8,
        discountAmount: 0,
        subtotal: 1760,
        total: 2076.8
      }
    ]
  },
  {
    id: 'sub_202',
    subscriptionNumber: 'SUB-2026-8802',
    customerId: 'cust_1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@apexlogistics.com',
    planId: 'plan_dunning_monthly',
    planName: 'Autonomous Dunning Studio (Monthly)',
    billingInterval: 'monthly',
    status: 'active',
    startDate: '2026-02-01',
    nextBillingDate: '2026-11-01',
    expiryDate: '2027-02-01',
    paymentTerms: 'Due on receipt',
    autoRenew: true,
    totalAmount: 600,
    createdAt: '2026-02-01',
    lines: [
      {
        id: 'subline_2',
        productId: 'prod_2',
        productName: 'Automated Dunning & Billing Engine',
        variantId: 'var_dun_ai',
        variantName: 'Neural Dunning & Churn Predictor (+220)',
        quantity: 1,
        unitPrice: 600,
        taxRate: 18,
        taxAmount: 108,
        discountAmount: 0,
        subtotal: 600,
        total: 708
      }
    ]
  },
  {
    id: 'sub_203',
    subscriptionNumber: 'SUB-2026-8803',
    customerId: 'cust_4',
    customerName: 'Amira Patel',
    customerEmail: 'amira@stellarretail.com',
    planId: 'plan_bms_monthly',
    planName: 'Business Software Pro (Monthly)',
    billingInterval: 'monthly',
    status: 'paused',
    startDate: '2026-03-01',
    nextBillingDate: '2026-12-01',
    expiryDate: '2027-03-01',
    paymentTerms: 'Net 15 Days',
    autoRenew: false,
    pauseReason: 'Customer seasonal ERP infrastructure maintenance.',
    totalAmount: 1200,
    createdAt: '2026-03-01',
    lines: [
      {
        id: 'subline_3',
        productId: 'prod_1',
        productName: 'Business Management Software',
        variantId: 'var_std',
        variantName: 'Standard Edition',
        quantity: 1,
        unitPrice: 1200,
        taxRate: 18,
        taxAmount: 216,
        discountAmount: 0,
        subtotal: 1200,
        total: 1416
      }
    ]
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_901',
    invoiceNumber: 'INV-2026-1049',
    customerId: 'cust_1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@apexlogistics.com',
    subscriptionId: 'sub_201',
    subscriptionNumber: 'SUB-2026-8801',
    invoiceDate: '2026-10-20',
    dueDate: '2026-11-04',
    subtotal: 1760,
    discountTotal: 0,
    taxTotal: 316.8,
    totalAmount: 2076.8,
    amountPaid: 2076.8,
    outstandingBalance: 0,
    status: 'paid',
    sentDate: '2026-10-20',
    lines: [
      {
        id: 'inv_line_1',
        productId: 'prod_1',
        productName: 'Business Management Software (Odoo Brand Edition)',
        quantity: 1,
        unitPrice: 1760,
        taxRate: 18,
        taxAmount: 316.8,
        discountAmount: 0,
        subtotal: 1760,
        total: 2076.8
      }
    ]
  },
  {
    id: 'inv_902',
    invoiceNumber: 'INV-2026-1050',
    customerId: 'cust_2',
    customerName: 'Marcus Chen',
    customerEmail: 'marcus@nexuscloud.io',
    subscriptionId: 'sub_202',
    subscriptionNumber: 'SUB-2026-8802',
    invoiceDate: '2026-10-05',
    dueDate: '2026-10-20',
    subtotal: 1760,
    discountTotal: 0,
    taxTotal: 316.8,
    totalAmount: 2076.8,
    amountPaid: 316.8,
    outstandingBalance: 1760,
    status: 'overdue',
    sentDate: '2026-10-05',
    lines: [
      {
        id: 'inv_line_2',
        productId: 'prod_1',
        productName: 'Business Management Software (Odoo Brand Edition)',
        quantity: 1,
        unitPrice: 1760,
        taxRate: 18,
        taxAmount: 316.8,
        discountAmount: 0,
        subtotal: 1760,
        total: 2076.8
      }
    ]
  },
  {
    id: 'inv_903',
    invoiceNumber: 'INV-2026-1051',
    customerId: 'cust_4',
    customerName: 'Amira Patel',
    customerEmail: 'amira@stellarretail.com',
    invoiceDate: '2026-10-28',
    dueDate: '2026-11-12',
    subtotal: 550,
    discountTotal: 0,
    taxTotal: 99,
    totalAmount: 649,
    amountPaid: 0,
    outstandingBalance: 649,
    status: 'confirmed',
    sentDate: '2026-10-28',
    lines: [
      {
        id: 'inv_line_3',
        productId: 'prod_3',
        productName: 'Priority SLA & Concierge Onboarding',
        quantity: 1,
        unitPrice: 550,
        taxRate: 18,
        taxAmount: 99,
        discountAmount: 0,
        subtotal: 550,
        total: 649
      }
    ]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_701',
    paymentReference: 'PAY-2026-5501',
    customerId: 'cust_1',
    customerName: 'Sarah Jenkins',
    invoiceId: 'inv_901',
    invoiceNumber: 'INV-2026-1049',
    method: 'Card',
    amount: 2076.8,
    paymentDate: '2026-10-20',
    transactionReference: 'ch_3N8zXF2eZvKYlo2C09P7w9kM',
    notes: 'Automated Stripe card capture (ending 4242)',
    status: 'completed'
  },
  {
    id: 'pay_702',
    paymentReference: 'PAY-2026-5502',
    customerId: 'cust_2',
    customerName: 'Marcus Chen',
    invoiceId: 'inv_902',
    invoiceNumber: 'INV-2026-1050',
    method: 'Bank Transfer',
    amount: 316.8,
    paymentDate: '2026-10-18',
    transactionReference: 'WIRE-US-991204',
    notes: 'Partial advance tax payment wire received.',
    status: 'completed'
  }
];

export const INITIAL_BILLING_RUNS: BillingRun[] = [
  {
    id: 'run_oct_2026',
    startedAt: '2026-10-01 02:00:15',
    completedAt: '2026-10-01 02:00:24',
    totalProcessed: 58,
    successful: 56,
    failed: 2,
    status: 'completed',
    generatedInvoiceIds: ['inv_901', 'inv_902'],
    totalBilledAmount: 94820
  }
];

export const INITIAL_DUNNING_EVENTS: DunningEvent[] = [
  {
    id: 'dun_1',
    invoiceId: 'inv_902',
    invoiceNumber: 'INV-2026-1050',
    customerName: 'Marcus Chen (Nexus Cloud)',
    amount: 1760,
    attemptNumber: 2,
    maxAttempts: 4,
    nextRetryDate: 'Tomorrow at 09:00 AM',
    lastFailureReason: 'Card issuer soft decline (temporary limit exceeded)',
    status: 'retrying',
    recoveryStrategy: 'Smart retry with cascading alternate gateway and auto-SMS payment link'
  },
  {
    id: 'dun_2',
    invoiceId: 'inv_903',
    invoiceNumber: 'INV-2026-1051',
    customerName: 'Amira Patel (Stellar Retail)',
    amount: 649,
    attemptNumber: 1,
    maxAttempts: 3,
    nextRetryDate: 'In 3 days',
    lastFailureReason: 'Expired payment method token',
    status: 'grace_period',
    recoveryStrategy: 'Automated subscriber portal update prompt dispatched'
  }
];
