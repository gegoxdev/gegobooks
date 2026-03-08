const PAYSTACK_PUBLIC_KEY = 'pk_test_ed98ff4500e431b1a90e7b0e53094ff199ed5d2a';

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

export async function openPaystackPopup({ email, amount, onSuccess, onClose, metadata }: PaystackConfig) {
  await loadPaystackScript();

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    currency: 'NGN',
    metadata: metadata || {},
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });

  handler.openIframe();
}

export const TIER_PRICES = {
  priority: { amount: 150000, label: '$1 (₦1,500)' }, // 150,000 kobo = ₦1,500
  founder: { amount: 1500000, label: '$10 (₦15,000)' }, // 1,500,000 kobo = ₦15,000
} as const;
