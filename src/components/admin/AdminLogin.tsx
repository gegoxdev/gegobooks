import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginProps {
  onSuccess: (userId: string) => void;
}

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (data.user) onSuccess(data.user.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4">
        <h1 className="font-heading font-bold text-xl text-foreground text-center">Admin Login</h1>
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
