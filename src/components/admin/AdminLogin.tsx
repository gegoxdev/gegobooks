import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Check } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

interface AdminLoginProps {
  onSuccess: (userId: string) => void;
}

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string } | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ id: string; role: string; invited_by_email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite');

  useEffect(() => {
    if (inviteToken) setMode('signup');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLoggedInUser({ id: session.user.id, email: session.user.email || '' });
        if (inviteToken) {
          handleAcceptByToken(inviteToken, session.user.id);
        } else {
          checkPendingInvite();
        }
      }
    });
  }, []);

  const checkPendingInvite = async () => {
    const { data } = await supabase.rpc('check_my_admin_invite' as any);
    if (data && Array.isArray(data) && data.length > 0) {
      setPendingInvite(data[0] as any);
    }
  };

  const handleAcceptByToken = async (token: string, userId: string) => {
    setAccepting(true);
    const { error: acceptError } = await supabase.rpc('accept_admin_invite' as any, { invite_token: token });
    if (acceptError) {
      setError(acceptError.message);
      toast.error(acceptError.message);
    } else {
      toast.success('Invite accepted! You are now an admin.');
      window.history.replaceState({}, '', '/admin');
      onSuccess(userId);
    }
    setAccepting(false);
  };

  const handleAcceptPending = async () => {
    if (!loggedInUser) return;
    const { data: inviteData } = await supabase
      .from('admin_invites')
      .select('token')
      .eq('id', pendingInvite?.id)
      .single();

    if (inviteData?.token) {
      await handleAcceptByToken(inviteData.token, loggedInUser.id);
    } else {
      toast.error('Could not find invite details');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      setLoggedInUser({ id: data.user.id, email: data.user.email || '' });
      if (inviteToken) {
        await handleAcceptByToken(inviteToken, data.user.id);
      } else {
        const { data: invData } = await supabase.rpc('check_my_admin_invite' as any);
        if (invData && Array.isArray(invData) && invData.length > 0) {
          setPendingInvite(invData[0] as any);
          setLoading(false);
          return;
        }
        onSuccess(data.user.id);
      }
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/admin${inviteToken ? `?invite=${inviteToken}` : ''}`,
      },
    });
    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      // Auto-confirmed — accept invite immediately
      setLoggedInUser({ id: data.user.id, email: data.user.email || '' });
      if (inviteToken) {
        await handleAcceptByToken(inviteToken, data.user.id);
      }
    } else {
      toast.success('Check your email to verify your account, then come back to accept the invite.');
    }
    setLoading(false);
  };

  // Show pending invite acceptance UI
  if (loggedInUser && pendingInvite && !accepting) {
    const roleLabels: Record<string, string> = {
      readonly: 'Read Only',
      approver: 'Approver',
      admin: 'Admin',
      master: 'Master',
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto" />
          <h1 className="font-heading font-bold text-xl text-foreground">Admin Invite</h1>
          <p className="font-body text-sm text-muted">
            You've been invited by <strong>{pendingInvite.invited_by_email}</strong> to join as{' '}
            <strong>{roleLabels[pendingInvite.role] || pendingInvite.role}</strong>.
          </p>
          <button
            onClick={handleAcceptPending}
            className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg inline-flex items-center justify-center gap-2 hover:opacity-90"
          >
            <Check className="w-4 h-4" />
            Accept Invite
          </button>
          <button
            onClick={() => { setPendingInvite(null); onSuccess(loggedInUser.id); }}
            className="w-full font-body text-sm text-muted hover:text-foreground py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Accepting invite...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={mode === 'login' ? handleLogin : handleSignup}
        className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4"
      >
        <h1 className="font-heading font-bold text-xl text-foreground text-center">
          {mode === 'login' ? 'Admin Login' : 'Create Admin Account'}
        </h1>
        {inviteToken && (
          <p className="font-body text-sm text-primary text-center bg-primary/10 rounded-lg px-3 py-2">
            {mode === 'signup'
              ? 'Create an account to accept your admin invite'
              : 'Sign in to accept your admin invite'}
          </p>
        )}
        {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}

        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Password"
        />
        {mode === 'signup' && (
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {loading
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
            : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          className="w-full font-body text-sm text-muted hover:text-foreground py-2"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
