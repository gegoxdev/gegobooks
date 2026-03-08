import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import logo from '@/assets/gegobooks-logo.jpg';
import PasswordInput from '@/components/PasswordInput';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const getRedirectPath = () => {
    if (redirect === 'waitlist-tiers') return '/#waitlist-tiers';
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
    const { error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin + (redirect ? `/login?redirect=${redirect}` : '/dashboard'),
        data: { full_name: fullName.trim() },
      },
    });

    if (err) {
      setError(err.message);
    } else {
      // Redirect to OTP verification page
      const redirectPath = redirect ? `/login?redirect=${redirect}` : '/dashboard';
      navigate(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect=${encodeURIComponent(redirectPath)}`);
    }
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
      {/* Left decorative panel — hidden on mobile */}
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

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="font-body text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
