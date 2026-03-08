import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const getRedirectPath = () => {
    if (redirect === 'waitlist-tiers') return '/#waitlist-tiers';
    return '/dashboard';
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(getRedirectPath());
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }
      if (fullName.trim().length > 200) {
        setError('Name is too long');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
          data: { full_name: fullName.trim() },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Check your email for a confirmation link, then sign in.');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-heading font-bold text-2xl text-foreground">GegoBooks</h1>
          <p className="font-body text-sm text-muted mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl shadow-lg border border-border p-8 space-y-4"
        >
          {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}
          {success && <p className="text-primary text-sm font-body text-center">{success}</p>}

          {isSignUp && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <p className="text-center font-body text-sm text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="font-body text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
