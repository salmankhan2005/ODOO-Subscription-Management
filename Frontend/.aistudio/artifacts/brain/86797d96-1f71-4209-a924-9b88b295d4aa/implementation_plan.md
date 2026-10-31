# Brightloop Software — Enterprise Subscription Management & Revenue Engine

A unified, enterprise-grade recurring billing and subscription management platform inspired by Recurly, featuring a Dark Obsidian Bento UI layout, fluid micro-interactions, role-specific workspaces (Admin, Staff, Customer Portal), and an Autonomous Revenue & Dunning Recovery Engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were selected during Phase 1:
> - **Visual Aesthetic**: Dark Obsidian surface architecture (`#0B0F17`) with illuminated glass Bento cards, subtle border glows, and monospace tabular metrics.
> - **Entry Experience**: Full Dual Experience featuring an interactive Recurly-inspired Bento showcase landing page with instant seamless launch into the live multi-role Enterprise App.
> - **Flagship Enhancement**: AI Revenue & Dunning Recovery Engine with an interactive batch billing simulator that processes subscriptions, models retry cascades, and automates grace period dunning.

---

## 1. Overview & Core Concept

Brightloop Software eliminates the spreadsheet chaos and manual billing errors detailed in the Odoo challenge by replacing ad-hoc workflows with an integrated quote-to-cash engine.

- **What It Does**: Unifies plan cataloging, variant pricing (e.g. brand markups like +$560), multi-tier quotation workflows, automated invoice generation, payment capture, tax/discount enforcement, and self-service subscriber management.
- **Target Personas**:
  - **Admin**: Sets up products, plans, tax/discount rules, team staff, executes billing runs, and monitors MRR/ARR analytics.
  - **Staff / Sales**: Prepares quotations from templates, converts confirmed quotes into active subscriptions, and captures payments.
  - **Subscriber (Customer)**: Self-service portal to review active plans, upgrade or switch tiers, inspect invoices, and track payments without emailing support.
- **Flagship Differentiator**: An interactive **AI Revenue & Dunning Recovery Engine** that visually simulates automated billing cycles, detects failed transactions, schedules intelligent retry cascades, and calculates churn risk scores.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Design System
- **Palette**: Dark Obsidian (`#0B0F17` dominant background, `#111827` secondary card surfaces, `#1E293B` hairline structural borders, `#6366F1` Indigo primary accent, `#10B981` Emerald for success/active states, `#F59E0B` Amber for pending/grace periods, `#EF4444` Crimson for overdue alerts).
- **Typography**: `Plus Jakarta Sans` for clean, high-contrast headings; `Public Sans` for dense scannable tables; `IBM Plex Mono` / `tabular-nums` for currencies, rates, invoice numbers, and timestamps.
- **Bento Grid Architecture**: Asymmetric, high-information-density cards with subtle 1px glass borders, hovered edge illumination, and zero unnecessary decorative pills or fake comment syntax.
- **Motion & Micro-interactions**: Smooth 180ms spring tabs, step-by-step wizard transitions with Framer Motion, dynamic pricing recalculations on variant changes, and live progress bars for batch billing execution.

### Key User Flows
1. **Landing & Interactive Product Showcase**:
   - Hero banner with Recurly-inspired value proposition and live interactive Bento metrics.
   - Live interactive widget: Dynamic Plan & Variant Calculator (+560 brand adder preview).
   - Instant "Launch Live Workspace" CTA triggering role selection (Admin, Staff, Customer Portal) with pre-seeded demo state.
2. **Quote-to-Subscription Workflow (Staff / Admin)**:
   - Quotation template selection $\rightarrow$ Customer selection $\rightarrow$ Line item configuration with live tax and discount math $\rightarrow$ Quotation confirmation $\rightarrow$ One-click conversion to Active Subscription.
3. **Automated Billing Day & Dunning Run**:
   - Billing dashboard displays due subscriptions $\rightarrow$ "Run Billing Batch" triggers an animated multi-stage job $\rightarrow$ Invoices auto-generated with calculated taxes $\rightarrow$ Dunning simulator recovers failed cards with visual cascade logic.
4. **Customer Self-Service Portal**:
   - Clean client overview displaying active plans, renewal countdown, downloadable PDF invoice previews, and payment history.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Presentation Layer (Showcase + Full App)**
  - *Approach*: Provide a Bento landing experience showcasing the product's value proposition, paired with an instant switch to the live enterprise SaaS application containing all 17 specification modules.
  - *Rationale*: Satisfies hackathon recruiters and clients wanting both high-end marketing appeal and full operational depth.
- **Decision 2: High-Fidelity Local State Engine with Centralized Axios API Architecture**
  - *Approach*: Structure all data operations through modular API services (`authApi`, `customerApi`, `subscriptionApi`, `billingApi`, etc.) wired to an Axios client pointing to `VITE_API_BASE_URL` with a resilient in-memory and `localStorage` fallback.
  - *Rationale*: Fully compliant with the prompt's instruction to support standalone execution without requiring an active Flask server, while providing ready-to-connect API contracts.
- **Decision 3: Zero-Pill & Strict Typographic Polish**
  - *Approach*: Adhere strictly to the Universal Frontend Design Constitution (unboxed metadata with subtle typographic separators `·`, tabular numerals, clear 60-30-10 color discipline, and clean 3-zone navigation).

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Root Router & Shell                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────┐             ┌────────────────────────────────┐
│   Bento Showcase & Landing    │             │   Enterprise Workspace Shell   │
│   - Hero Bento Grid           │             │   - Collapsible Sidebar Nav    │
│   - Interactive Variant Calc  │             │   - Top Bar with Global Search │
│   - Feature Storytelling      │             │   - Role Switcher (Admin/Staff/│
│   - 1-Click Launch Modal      │             │     Customer) & Notifications  │
└───────────────────────────────┘             └───────────────┬────────────────┘
                                                              │
         ┌────────────────────────────────────────────────────┼─────────────────────────────────┐
         ▼                                                    ▼                                 ▼
┌─────────────────────────────────┐        ┌──────────────────────────────────┐      ┌──────────────────────────┐
│      Admin Experience           │        │         Staff Experience         │      │     Customer Portal      │
│  - Bento Financial Analytics    │        │  - Pipeline & Customer Records   │      │  - My Subscriptions      │
│  - Product & Variant Catalog    │        │  - Quote-to-Cash Wizard          │      │  - Plan Upgrade/Switch   │
│  - Plan Configuration Engine    │        │  - Subscription Lifecycle Ops    │      │  - Invoices & PDF View   │
│  - AI Billing & Dunning Studio  │        │  - Manual Payment Recording      │      │  - Payment Receipts      │
│  - Taxes, Discounts & Reports   │        │  - Invoice Dispatching           │      │  - Profile Settings      │
└─────────────────────────────────┘        └──────────────────────────────────┘      └──────────────────────────┘
                                                              │
                                                              ▼
                                           ┌──────────────────────────────────┐
                                           │   Modular API & Storage Layer    │
                                           │   - Centralized Axios Client     │
                                           │   - Mock State Storage Engine    │
                                           │   - Auto-Tax & Dunning Logic     │
                                           └──────────────────────────────────┘
```

### Module Breakdown
- `src/api/*`: Complete API modules (`authApi`, `customerApi`, `productApi`, `planApi`, `quotationApi`, `subscriptionApi`, `invoiceApi`, `paymentApi`, `discountApi`, `taxApi`, `billingApi`, `dashboardApi`, `portalApi`).
- `src/components/layout/`: `Sidebar.tsx`, `TopNav.tsx`, `BentoContainer.tsx`, `RoleSwitcher.tsx`.
- `src/components/billing/`: `DunningRecoveryStudio.tsx`, `BatchBillingRunner.tsx`, `TaxCalculationPreview.tsx`.
- `src/components/quotations/`: `QuotationWizard.tsx`, `QuotationDetailModal.tsx`.
- `src/components/subscriptions/`: `SubscriptionDetailModal.tsx`, `SubscriptionStatusBadge.tsx`.
- `src/components/invoices/`: `InvoiceDocumentModal.tsx`, `PaymentRecordModal.tsx`.
- `src/components/landing/`: `BentoHero.tsx`, `InteractiveVariantCalculator.tsx`, `FeatureGrid.tsx`.
- `src/context/AuthContext.tsx`: Manages active persona, authentication state, and role-based permissions.
