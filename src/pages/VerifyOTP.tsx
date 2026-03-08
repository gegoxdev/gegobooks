import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/gegobooks-logo.jpg';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (err) {
      setError(err.message);
    } else {
      navigate(redirect);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    if (err) setError(err.message);
    else setResendSuccess('New code sent! Check your email.');
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="GegoBooks" className="w-12 h-12 rounded-lg mx-auto mb-4" />
          <h1 className="font-heading font-bold text-2xl text-foreground">Verify your email</h1>
          <p className="font-body text-sm text-muted mt-1">
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-surface rounded-2xl shadow-lg border border-border p-8 space-y-4">
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
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Verification code</label>
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
            className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-body text-sm text-primary hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : "Didn't receive a code? Resend"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="font-body text-sm text-muted hover:text-foreground transition-colors">
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
