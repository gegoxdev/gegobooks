import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Check, Lock } from 'lucide-react';
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

  // Invite token handling
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  // OTP verification state
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Fetch invite email from token on mount
  useEffect(() => {
    if (inviteToken) {
      setMode('signup');
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
      // Email verification required — show inline OTP
      setOtpMode(true);
      toast.success('A 6-digit verification code has been sent to your email.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);

    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (err) {
      setError(err.message);
    } else if (data.user) {
      setLoggedInUser({ id: data.user.id, email: data.user.email || '' });
      if (inviteToken) {
        await handleAcceptByToken(inviteToken, data.user.id);
      } else {
        onSuccess(data.user.id);
      }
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    if (err) setError(err.message);
    else setResendSuccess('New code sent! Check your email.');
    setResending(false);
  };

  const isEmailLocked = !!inviteEmail && mode === 'signup';

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

  // OTP verification screen (inline, admin-specific)
  if (otpMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-foreground">Verify your admin email</h1>
            <p className="font-body text-sm text-muted mt-1">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
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
              className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading ? 'Verifying...' : 'Verify & Accept Invite'}
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
        </div>
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
        {inviteToken && inviteEmail && (
          <p className="font-body text-sm text-primary text-center bg-primary/10 rounded-lg px-3 py-2">
            {mode === 'signup'
              ? `Create an account for ${inviteEmail} to accept your admin invite`
              : 'Sign in to accept your admin invite'}
          </p>
        )}
        {inviteToken && !inviteEmail && (
          <p className="font-body text-sm text-destructive text-center bg-destructive/10 rounded-lg px-3 py-2">
            This invite link is invalid or has expired.
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
        <div className="relative">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => !isEmailLocked && setEmail(e.target.value)}
            readOnly={isEmailLocked}
            required
            className={`w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground ${
              isEmailLocked ? 'bg-muted/10 cursor-not-allowed pr-10' : ''
            }`}
          />
          {isEmailLocked && (
            <Lock className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
        />
        {mode === 'signup' && (
          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
          />
        )}
        <button
          type="submit"
          disabled={loading || (!!inviteToken && !inviteEmail)}
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
