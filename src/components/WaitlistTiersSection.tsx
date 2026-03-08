import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const userTypes = [
  { value: 'user', label: 'Business Owner' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'both', label: 'Both' },
] as const;

const cards = [
  {
    title: 'Priority Waitlist',
    price: '$1 (₦1,500)',
    description: 'Jump the queue and get priority early access.',
    features: [
      'Priority access before public launch',
      'Jump ahead of the waitlist',
      'Exclusive early user updates',
      'Early adopter perks',
    ],
    cta: 'Get Priority Access',
    href: 'https://paystack.com/pay/gegobooks-priority',
    recommended: false,
  },
  {
    title: 'Founder Circle',
    price: '$10 (₦15,000)',
    description: 'For the earliest believers in the future of AI accounting.',
    features: [
      'Guaranteed first access to GegoBooks',
      'Direct communication with the founder',
      'Lifetime early adopter badge',
      'Special launch perks and discounts',
      'Name listed on GegoBooks Wall of Founders',
    ],
    cta: 'Join Founder Circle',
    href: 'https://paystack.shop/pay/gegobooks-founders-circle',
    recommended: true,
  },
];

const WaitlistTiersSection = () => {
  const navigate = useNavigate();
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [pendingHref, setPendingHref] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', userType: 'user' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  const handlePayClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login?redirect=waitlist-tiers');
      return;
    }

    // Check if user is on the waitlist
    const { data } = await supabase.rpc('get_my_waitlist_status');
    if (data && Array.isArray(data) && data.length > 0) {
      // Already on waitlist — proceed to payment
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      // Not on waitlist — show inline form
      setForm((f) => ({ ...f, email: session.user.email || '', fullName: session.user.user_metadata?.full_name || '' }));
      setPendingHref(href);
      setShowWaitlistForm(true);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (form.fullName.trim().length > 200) errs.fullName = 'Name is too long';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormLoading(true);

    const { error } = await supabase.from('waitlist_signups').insert({
      full_name: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      user_type: form.userType,
    });

    if (error) {
      if (error.code === '23505') {
        // Already on waitlist — just proceed
        window.open(pendingHref, '_blank', 'noopener,noreferrer');
        setShowWaitlistForm(false);
      } else {
        setErrors({ email: 'Something went wrong. Please try again.' });
      }
      setFormLoading(false);
      return;
    }

    setFormLoading(false);
    setShowWaitlistForm(false);
    window.open(pendingHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <section id="waitlist-tiers" className="py-16 md:py-24 bg-soft-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-12">
            <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
              Want to skip the line?
            </h2>
            <p className="mt-4 font-body text-base text-muted">
              Get early access and exclusive perks by joining a paid tier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {cards.map((card, i) => (
              <div
                key={card.title}
                className={`fade-up stagger-${i + 1} rounded-xl border p-6 flex flex-col ${
                  card.recommended
                    ? 'bg-surface border-accent shadow-lg ring-2 ring-accent/20'
                    : 'bg-surface border-primary shadow-sm ring-2 ring-primary/20'
                }`}
              >
                {card.recommended && (
                  <span className="inline-block self-start bg-accent text-accent-foreground font-body text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    ⭐ Recommended
                  </span>
                )}
                <h3 className="font-heading font-bold text-xl text-foreground">{card.title}</h3>
                <p className={`font-heading font-bold text-3xl mt-2 ${card.recommended ? 'text-accent' : 'text-primary'}`}>
                  {card.price}
                </p>
                <p className="font-body text-sm text-muted mt-2">{card.description}</p>

                <ul className="mt-4 space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground">
                      <span className={`font-bold mt-0.5 ${card.recommended ? 'text-accent' : 'text-primary'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handlePayClick(e)}
                  className={`mt-6 w-full font-body font-medium py-3 rounded-lg transition-opacity hover:opacity-90 text-center block ${
                    card.recommended
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {card.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist details modal for authenticated users not yet on the waitlist */}
      {showWaitlistForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowWaitlistForm(false)}>
          <div className="absolute inset-0 bg-secondary/60" />
          <div
            className="relative bg-surface w-full max-w-md mx-4 rounded-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowWaitlistForm(false)} className="absolute top-4 right-4 text-muted hover:text-foreground text-2xl">×</button>

            <h3 className="font-heading font-bold text-xl text-foreground mb-2">Join the waitlist first</h3>
            <p className="font-body text-sm text-muted mb-6">Complete your details to join the waitlist, then proceed to payment.</p>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Full name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1 font-body">{errors.fullName}</p>}
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface"
                />
                {errors.email && <p className="text-destructive text-xs mt-1 font-body">{errors.email}</p>}
              </div>

              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">I am a...</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {userTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, userType: t.value })}
                      className={`flex-1 font-body text-sm py-2.5 transition-colors ${
                        form.userType === t.value
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-surface text-muted hover:bg-muted/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {formLoading ? 'Joining...' : 'Join & Continue to Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WaitlistTiersSection;
