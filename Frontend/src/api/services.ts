/**
 * src/api/services.ts
 *
 * Re-exports from the real API clients.
 * This file replaces the previous localStorage mock implementation.
 * All calls now go to the Flask backend at VITE_API_BASE_URL.
 */

export { customerApi } from './customerApi';
export { productApi } from './productApi';
export { planApi } from './planApi';
export { quotationApi } from './quotationApi';
export { subscriptionApi } from './subscriptionApi';
export { invoiceApi } from './invoiceApi';
export { paymentApi } from './paymentApi';
export { discountApi } from './discountApi';
export { taxApi } from './taxApi';
export { billingApi } from './billingApi';
export { reportApi } from './reportApi';
export { portalApi } from './portalApi';
export { dashboardApi } from './dashboardApi';
export { livekitApi } from './livekitApi';
export type { LiveKitTokenResponse } from './livekitApi';
