import { useState } from 'react';

const africanCountries = [
  'Nigeria','Ghana','Kenya','South Africa','Tanzania','Uganda','Ethiopia','Cameroon','Senegal',
  'Côte d\'Ivoire','Rwanda','Egypt','Morocco','Algeria','Tunisia','Libya','Sudan','DR Congo',
  'Angola','Mozambique','Zimbabwe','Zambia','Malawi','Mali','Burkina Faso','Niger','Chad','Guinea',
  'Benin','Togo','Sierra Leone','Liberia','Central African Republic','Gabon','Republic of the Congo',
  'Mauritania','Eritrea','Djibouti','Somalia','Comoros','Mauritius','Seychelles','Cape Verde',
  'São Tomé and Príncipe','Equatorial Guinea','Eswatini','Lesotho','Botswana','Namibia','Madagascar',
  'Gambia','Guinea-Bissau','South Sudan',
];

const businessTypes = ['Trader','Retail Shop','Market Seller','Service Business','Other'];

interface SignupModalProps {
  isOpen: boolean;
  tier: 'free' | 'priority' | 'founder';
  onClose: () => void;
  utmParams: { utm_source: string; utm_medium: string; utm_campaign: string };
}

const tierTitles: Record<string, string> = {
  free: 'Join the Free Waitlist',
  priority: 'Get Priority Access',
  founder: 'Join the Founder Circle',
};

const SignupModal = ({ isOpen, tier, onClose, utmParams }: SignupModalProps) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessType: '',
    country: 'Nigeria',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.businessType) errs.businessType = 'Business type is required';
    if (!form.country) errs.country = 'Country is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Simulate submission (Supabase integration to be added with Cloud)
    await new Promise((r) => setTimeout(r, 1000));
    const position = Math.floor(Math.random() * 3000) + 1;

    setLoading(false);

    if (tier === 'free') {
      setSuccess(`You're on the list! We'll notify you when GegoBooks launches. Your position: #${position}`);
    } else if (tier === 'priority') {
      window.location.href = 'https://paystack.com/pay/gegobooks-priority';
    } else {
      window.location.href = 'https://paystack.com/pay/gegobooks-founder';
    }
  };

  const handleClose = () => {
    setSuccess(null);
    setErrors({});
    setForm({ fullName: '', email: '', phone: '', businessType: '', country: 'Nigeria' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-secondary/60" />
      <div
        className="relative bg-surface w-full max-w-md mx-4 md:rounded-2xl p-8 max-h-[90vh] overflow-y-auto md:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground text-2xl"
        >
          ×
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-heading font-bold text-xl text-primary">{success}</p>
            <button
              onClick={handleClose}
              className="mt-6 bg-primary text-primary-foreground font-body font-medium px-6 py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-heading font-bold text-xl text-foreground mb-6">
              {tierTitles[tier]}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1 font-body">{errors.fullName}</p>}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                />
                {errors.email && <p className="text-destructive text-xs mt-1 font-body">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="+234... (For WhatsApp updates)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                />
              </div>

              <div>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.businessType && <p className="text-destructive text-xs mt-1 font-body">{errors.businessType}</p>}
              </div>

              <div>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                >
                  {africanCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && <p className="text-destructive text-xs mt-1 font-body">{errors.country}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Submitting...' : tierTitles[tier]}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupModal;
