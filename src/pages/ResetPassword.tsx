import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/gegobooks-logo.jpg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Check hash for recovery token
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <img src={logo} alt="GegoBooks" className="w-12 h-12 rounded-lg mx-auto mb-4" />
          <h1 className="font-heading font-bold text-xl text-foreground mb-2">Invalid Reset Link</h1>
          <p className="font-body text-sm text-muted mb-6">
            This link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-primary-foreground font-body font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="GegoBooks" className="w-12 h-12 rounded-lg mx-auto mb-4" />
          <h1 className="font-heading font-bold text-2xl text-foreground">Set new password</h1>
          <p className="font-body text-sm text-muted mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-lg border border-border p-8 space-y-4">
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

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">New password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
