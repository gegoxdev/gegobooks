import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Check, Lock, Mail } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

interface AdminLoginProps {
  onSuccess: (userId: string) => void;
}

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string } | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ id: string; role: string; invited_by_email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Invite token handling
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  // Sign-up mode (for new users accepting invites)
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch invite email from token on mount
  useEffect(() => {
    if (inviteToken) {
      supabase.rpc('get_invite_email' as any, { invite_token: inviteToken }).then(({ data }) => {
        if (data) {
          setInviteEmail(data as string);
          setEmail(data as string);
        } else {
          setError('This invite link is invalid or has expired.');
        }
        setInviteLoading(false);
      });
    }

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
    if (!email.trim() || !password.trim()) return;

    if (inviteEmail && email.toLowerCase() !== inviteEmail.toLowerCase()) {
      setError('This invite is for a different email address.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // If email confirmation is required, the session may not exist yet
        if (data.session) {
          setLoggedInUser({ id: data.user.id, email: data.user.email || '' });
          if (inviteToken) {
            await handleAcceptByToken(inviteToken, data.user.id);
          } else {
            onSuccess(data.user.id);
          }
        } else {
          toast.info('Please check your email to confirm your account, then sign in.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        setLoggedInUser({ id: data.user.id, email: data.user.email || '' });
        if (inviteToken) {
          await handleAcceptByToken(inviteToken, data.user.id);
        } else {
          onSuccess(data.user.id);
        }
      }
    }

    setLoading(false);
  };

  const isEmailLocked = !!inviteEmail;

  // Loading invite info
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Loading invite...</div>
      </div>
    );
  }

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

  // Email + password login/signup screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleLogin}
        className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4"
      >
        <div className="text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-xl text-foreground">
            {inviteToken
              ? 'Accept Admin Invite'
              : isSignUp
              ? 'Admin Sign Up'
              : 'Admin Login'}
          </h1>
          <p className="font-body text-sm text-muted mt-1">
            {inviteToken
              ? 'Sign in or create an account to accept the invite'
              : isSignUp
              ? 'Create your admin account'
              : 'Sign in with your email and password'}
          </p>
        </div>

        {inviteToken && inviteEmail && (
          <p className="font-body text-sm text-primary text-center bg-primary/10 rounded-lg px-3 py-2">
            Invite for {inviteEmail}
          </p>
        )}
        {inviteToken && !inviteEmail && (
          <p className="font-body text-sm text-destructive text-center bg-destructive/10 rounded-lg px-3 py-2">
            This invite link is invalid or has expired.
          </p>
        )}
        {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}

        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Email</label>
          <div className="relative">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => !isEmailLocked && setEmail(e.target.value)}
              readOnly={isEmailLocked}
              required
              className={`w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow ${
                isEmailLocked ? 'bg-muted/10 cursor-not-allowed pr-10' : ''
              }`}
            />
            {isEmailLocked && (
              <Lock className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          required
        />

        {isSignUp && (
          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
        )}

        <button
          type="submit"
          disabled={loading || (!!inviteToken && !inviteEmail)}
          className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
        >
          {loading
            ? (isSignUp ? 'Creating account...' : 'Signing in...')
            : inviteToken
            ? (isSignUp ? 'Sign Up & Accept Invite' : 'Sign In & Accept Invite')
            : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setConfirmPassword(''); }}
            className="font-body text-sm text-primary hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
