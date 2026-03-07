import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ReferralDashboard from './ReferralDashboard';

const userTypes = [
  { value: 'user', label: 'Business Owner' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'both', label: 'Both' },
] as const;

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  utmParams: { utm_source: string; utm_medium: string; utm_campaign: string; ref: string };
}

const SignupModal = ({ isOpen, onClose, utmParams }: SignupModalProps) => {
  const [form, setForm] = useState({ fullName: '', email: '', userType: 'user' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState<{
    referral_code: string;
    waitlist_position: number;
    referrals_count: number;
  } | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (form.fullName.trim().length > 200) errs.fullName = 'Name is too long';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.email.length > 255) errs.email = 'Email is too long';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .insert({
          full_name: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          user_type: form.userType,
          referred_by: utmParams.ref || null,
          utm_source: utmParams.utm_source || null,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
        })
        .select('referral_code, waitlist_position, referrals_count')
        .single();

      if (error) {
        if (error.code === '23505') {
          setErrors({ email: 'This email is already on the waitlist!' });
        } else {
          setErrors({ email: 'Something went wrong. Please try again.' });
        }
        setLoading(false);
        return;
      }

      setSignupData(data);
      setLoading(false);
    } catch {
      setErrors({ email: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSignupData(null);
    setErrors({});
    setForm({ fullName: '', email: '', userType: 'user' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-secondary/60" />
      <div
        className="relative bg-surface w-full max-w-md mx-4 md:rounded-2xl p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-muted hover:text-foreground text-2xl">×</button>

        {signupData ? (
          <ReferralDashboard
            referralCode={signupData.referral_code}
            waitlistPosition={signupData.waitlist_position}
            referralsCount={signupData.referrals_count}
            onClose={handleClose}
          />
        ) : (
          <>
            <h3 className="font-heading font-bold text-xl text-foreground mb-6">Join the GegoBooks Waitlist</h3>
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
                <p className="font-body text-sm text-muted mb-2">I am a...</p>
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
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Joining...' : 'Join the Waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupModal;
