import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Check } from 'lucide-react';

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

  // Check for invite token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite');

  useEffect(() => {
    // Check if already logged in but not admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLoggedInUser({ id: session.user.id, email: session.user.email || '' });
        checkPendingInvite();
        if (inviteToken) {
          handleAcceptByToken(inviteToken, session.user.id);
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
      // Clean URL
      window.history.replaceState({}, '', '/admin');
      onSuccess(userId);
    }
    setAccepting(false);
  };

  const handleAcceptPending = async () => {
    if (!loggedInUser) return;
    // Need to fetch the token from invite to accept it
    // We use check_my_admin_invite which returns the invite, then accept by looking up the token
    // Actually we need to accept by token. Let's fetch it from admin_invites
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

      // Check for invite token in URL
      if (inviteToken) {
        await handleAcceptByToken(inviteToken, data.user.id);
      } else {
        // Check if user has a pending invite
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
      <form onSubmit={handleLogin} className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4">
        <h1 className="font-heading font-bold text-xl text-foreground text-center">Admin Login</h1>
        {inviteToken && (
          <p className="font-body text-sm text-primary text-center bg-primary/10 rounded-lg px-3 py-2">
            Please sign in to accept your admin invite
          </p>
        )}
        {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}
        <input
          type="email" placeholder="Admin email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
        />
        <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
