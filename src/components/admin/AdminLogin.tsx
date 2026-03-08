import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Mail } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (userId: string) => void;
}

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Check if already logged in as admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onSuccess(session.user.id);
      }
    });
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setLoading(true);

    // Check if email is in the admin list
    const { data: isAdmin } = await supabase.rpc('is_admin_email' as any, { check_email: email.trim() });

    if (!isAdmin) {
      setError('This email has not been added as an admin. Contact a master admin to get access.');
      setLoading(false);
      return;
    }

    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setOtpMode(true);
      toast.success('Admin verification code sent to your email.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);

    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'email',
    });

    if (err) {
      setError(err.message);
    } else if (data.user) {
      // Link user_id to admin_users if not already linked
      await supabase.rpc('link_admin_user' as any, {
        admin_email: email.trim(),
        admin_user_id: data.user.id,
      });
      toast.success('Signed in successfully!');
      onSuccess(data.user.id);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (err) setError(err.message);
    else setResendSuccess('New verification code sent! Check your email.');
    setResending(false);
  };

  // OTP verification screen
  if (otpMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-foreground">
              Admin Verification
            </h1>
            <p className="font-body text-sm text-muted mt-1">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="bg-surface rounded-2xl shadow-lg border border-border p-8 space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <p className="text-destructive text-sm font-body">{error}</p>
              </div>
            )}
            {resendSuccess && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                <p className="text-primary text-sm font-body">{resendSuccess}</p>
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow text-center tracking-[0.5em] text-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="font-body text-sm text-primary hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : "Didn't receive a code? Resend"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setOtpMode(false); setOtp(''); setError(''); setResendSuccess(''); }}
              className="font-body text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email entry screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSendOtp}
        className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4"
      >
        <div className="text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-xl text-foreground">Admin Sign In</h1>
          <p className="font-body text-sm text-muted mt-1">
            Enter your admin email to receive a verification code
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-destructive text-sm font-body text-center">{error}</p>
          </div>
        )}

        <input
          type="email"
          placeholder="Enter your admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {loading ? 'Checking...' : 'Send Verification Code'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
