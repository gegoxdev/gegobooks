const PAYSTACK_PUBLIC_KEY = 'pk_live_b62d02c1d797b92aee1b25a6b6ac6d7bf7b4c146';
const PENDING_PAYMENT_KEY = 'gegobooks_pending_payment';

interface PaystackConfig {
  email: string;
  amount: number; // in kobo (₦1 = 100 kobo)
  onSuccess: (reference: string) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
}

// Dynamically load Paystack inline script
let paystackLoaded = false;
function loadPaystackScript(): Promise<void> {
  if (paystackLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => { paystackLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

function generateReference(): string {
  return 'gego_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

export interface PendingPayment {
  reference: string;
  tier: string;
  timestamp: number;
}

export function savePendingPayment(reference: string, tier: string) {
  const pending: PendingPayment = { reference, tier, timestamp: Date.now() };
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));
}

export function getPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    const pending: PendingPayment = JSON.parse(raw);
    // Expire after 30 minutes (Paystack default timeout)
    if (Date.now() - pending.timestamp > 30 * 60 * 1000) {
      clearPendingPayment();
      return null;
    }
    return pending;
  } catch {
    clearPendingPayment();
    return null;
  }
}

export function clearPendingPayment() {
  localStorage.removeItem(PENDING_PAYMENT_KEY);
}

export async function openPaystackPopup({ email, amount, onSuccess, onClose, metadata }: PaystackConfig) {
  await loadPaystackScript();

  const reference = generateReference();
  const tier = (metadata?.tier as string) || '';

  // Save pending payment before opening popup
  if (tier) savePendingPayment(reference, tier);

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    currency: 'NGN',
    ref: reference,
    metadata: metadata || {},
    callback: (response: { reference: string }) => {
      clearPendingPayment();
      onSuccess(response.reference);
    },
    onClose: () => {
      // Don't clear pending payment on close — user may have paid but closed early
      onClose();
    },
  });

  handler.openIframe();
}

export const TIER_PRICES = {
  priority: { amount: 150000, label: '$1 (₦1,500)' }, // 150,000 kobo = ₦1,500
  founder: { amount: 1500000, label: '$10 (₦15,000)' }, // 1,500,000 kobo = ₦15,000
} as const;
