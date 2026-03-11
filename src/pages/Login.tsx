import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import logo from '@/assets/gegobooks-logo.png';
import PasswordInput from '@/components/PasswordInput';
import { ArrowLeft } from 'lucide-react';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const refCode = searchParams.get('ref') || '';

  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(refCode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-switch to sign_up view if ref code is present
  useEffect(() => {
    if (refCode) setView('sign_up');
  }, [refCode]);

  const getRedirectPath = () => {
    if (redirect === 'waitlist-tiers') return '/#waitlist-tiers';
    if (redirect === 'challenge') return '/dashboard';
    return '/dashboard';
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(getRedirectPath());
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(getRedirectPath());
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirect]);

  const resetMessages = () => { setError(''); setSuccess(''); };

  const switchView = (v: AuthView) => {
    setView(v);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (err) setError(err.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (fullName.trim().length > 200) { setError('Name is too long'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin + (redirect ? `/login?redirect=${redirect}` : '/dashboard'),
        data: { full_name: fullName.trim(), referral_code: referralCode.trim() || null },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const alreadyExistingAccount = Boolean(data.user?.email_confirmed_at) || (data.user?.identities?.length ?? 0) === 0;

    if (alreadyExistingAccount) {
      setLoading(false);
      setView('sign_in');
      setPassword('');
      setConfirmPassword('');
      setSuccess('This email is already registered. Please sign in instead.');
      return;
    }

    const redirectPath = redirect ? `/login?redirect=${redirect}` : '/dashboard';
    navigate(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect=${encodeURIComponent(redirectPath)}`);
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) { setError('Enter your email address'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Password reset link sent! Check your email.');
    }
    setLoading(false);
  };

  const headings: Record<AuthView, { title: string; subtitle: string }> = {
    sign_in: { title: 'Welcome back', subtitle: 'Sign in to your GegoBooks account' },
    sign_up: { title: 'Get started', subtitle: 'Create your GegoBooks account' },
    forgot_password: { title: 'Reset password', subtitle: 'We\'ll send you a reset link' },
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-accent" />
          <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-surface" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={logo} alt="GegoBooks" className="w-10 h-10 rounded-lg" />
            <span className="font-heading font-bold text-2xl text-primary-foreground">GegoBooks</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="font-heading font-bold text-3xl text-primary-foreground leading-tight">
            AI-powered accounting<br />built for Africa 🌍
          </h2>
          <p className="font-body text-primary-foreground/80 text-lg max-w-md">
            Join thousands of business owners and accountants on the waitlist for the smartest bookkeeping tool on the continent.
          </p>
          <div className="flex gap-6 pt-4">
            {[
              { label: 'Waitlist members', value: '2,000+' },
              { label: 'Countries', value: '15+' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-heading font-bold text-2xl text-accent">{s.value}</p>
                <p className="font-body text-sm text-primary-foreground/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 font-body text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} GegoBooks. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Back to Home - prominent */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-body text-sm font-semibold text-primary hover:text-primary/80 transition-colors mb-6 bg-primary/10 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={logo} alt="GegoBooks" className="w-8 h-8 rounded-md" />
            <span className="font-heading font-bold text-xl text-primary">GegoBooks</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl text-foreground">
              {headings[view].title}
            </h1>
            <p className="font-body text-sm text-muted mt-1">{headings[view].subtitle}</p>
          </div>

          <form
            onSubmit={view === 'sign_in' ? handleSignIn : view === 'sign_up' ? handleSignUp : handleForgotPassword}
            className="space-y-4"
          >
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <p className="text-destructive text-sm font-body">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                <p className="text-primary text-sm font-body">{success}</p>
              </div>
            )}

            {view === 'sign_up' && (
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Full name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>

            {view !== 'forgot_password' && (
              <>
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  required
                  rightLabel={view === 'sign_in' ? (
                    <button
                      type="button"
                      onClick={() => switchView('forgot_password')}
                      className="font-body text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  ) : undefined}
                />
                {view === 'sign_up' && (
                  <PasswordInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                  />
                )}
              </>
            )}

            {/* Referral Code Field - only on sign up */}
            {view === 'sign_up' && (
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                  Referral Code <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow uppercase"
                />
                {referralCode && (
                  <p className="font-body text-xs text-primary mt-1">✓ Referral code will be applied to your waitlist signup</p>
                )}
              </div>
            )}

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
              {loading
                ? 'Please wait...'
                : view === 'sign_in'
                ? 'Sign In'
                : view === 'sign_up'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          {/* Divider */}
          {view !== 'forgot_password' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="font-body text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                disabled={googleLoading}
                onClick={async () => {
                  setGoogleLoading(true);
                  resetMessages();
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    setError(result.error.message || 'Google sign-in failed');
                    setGoogleLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-3 px-4 hover:bg-muted/10 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-body text-sm font-medium text-foreground">
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>
            </>
          )}

          {/* View switchers */}
          <div className="mt-6 text-center space-y-2">
            {view === 'sign_in' && (
              <p className="font-body text-sm text-muted">
                Don't have an account?{' '}
                <button onClick={() => switchView('sign_up')} className="text-primary font-medium hover:underline">
                  Sign Up
                </button>
              </p>
            )}
            {view === 'sign_up' && (
              <p className="font-body text-sm text-muted">
                Already have an account?{' '}
                <button onClick={() => switchView('sign_in')} className="text-primary font-medium hover:underline">
                  Sign In
                </button>
              </p>
            )}
            {view === 'forgot_password' && (
              <p className="font-body text-sm text-muted">
                Remember your password?{' '}
                <button onClick={() => switchView('sign_in')} className="text-primary font-medium hover:underline">
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
