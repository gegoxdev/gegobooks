import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Send, Clock, Star, Award, ExternalLink } from 'lucide-react';

interface ChallengeDashboardProps {
  user: any;
  waitlistData: any;
}

type ActiveChallenge = {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  start_date: string;
  end_date: string;
  prize_amount: number;
};

type Submission = {
  id: string;
  content_url: string;
  platform: string;
  caption: string | null;
  status: string;
  is_weekly_winner: boolean;
  is_monthly_winner: boolean;
  created_at: string;
  challenge_week_id: string;
};

const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'];

const ChallengeDashboard = ({ user, waitlistData }: ChallengeDashboardProps) => {
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ content_url: '', platform: 'instagram', caption: '' });
  const [showForm, setShowForm] = useState(false);

  const referralsCount = waitlistData?.referrals_count || 0;
  const isEligible = referralsCount >= 3;
  const comingSoon = true; // Set to false when challenge launches

  useEffect(() => {
    const fetch = async () => {
      const { data: challengeData } = await supabase.rpc('get_active_challenge');
      if (challengeData && Array.isArray(challengeData) && challengeData.length > 0) {
        setChallenge(challengeData[0] as ActiveChallenge);
      }
      const { data: subs } = await supabase.from('challenge_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (subs) setSubmissions(subs as Submission[]);
      setLoading(false);
    };
    fetch();
  }, [user.id]);

  const handleSubmit = async () => {
    if (!form.content_url.trim()) { toast.error('Content URL is required'); return; }
    if (!challenge) { toast.error('No active challenge'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('challenge_submissions').insert({
      challenge_week_id: challenge.id,
      user_id: user.id,
      user_email: user.email,
      user_name: waitlistData?.full_name || user.email,
      content_url: form.content_url.trim(),
      platform: form.platform,
      caption: form.caption.trim() || null,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    toast.success('Submission received! 🎉');
    setForm({ content_url: '', platform: 'instagram', caption: '' });
    setShowForm(false);
    setSubmitting(false);
    // Refresh
    const { data: subs } = await supabase.from('challenge_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (subs) setSubmissions(subs as Submission[]);
  };

  // Badges
  const badges = [];
  if (submissions.some(s => s.status === 'approved')) badges.push({ icon: '📝', label: 'Submitted this week' });
  if (submissions.some(s => s.is_weekly_winner)) badges.push({ icon: '🏆', label: 'Creator of the Week' });
  if (submissions.some(s => s.is_monthly_winner)) badges.push({ icon: '👑', label: 'Creator of the Month' });

  if (loading) return <div className="animate-pulse font-body text-muted p-4">Loading challenge...</div>;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
      <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Creator Challenge
      </h2>

      {comingSoon ? (
        /* Coming Soon State */
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-body text-sm font-semibold px-4 py-2 rounded-full">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
          <h3 className="font-heading font-bold text-xl text-foreground">
            The GegoBooks Creator Challenge is launching soon!
          </h3>
          <p className="font-body text-muted text-sm max-w-md mx-auto">
            A weekly content creation competition with cash prizes. Make sure you have at least 3 referrals to qualify.
          </p>
          <div className="bg-background rounded-xl border border-border p-4 max-w-sm mx-auto">
            <p className="font-body text-sm text-muted mb-2">Your Eligibility</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`font-heading font-bold text-2xl ${isEligible ? 'text-primary' : 'text-destructive'}`}>
                {referralsCount}/3
              </span>
              <span className="font-body text-sm text-muted">referrals</span>
            </div>
            <div className="w-full bg-border rounded-full h-2 mt-2">
              <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min((referralsCount / 3) * 100, 100)}%` }} />
            </div>
            <p className={`font-body text-xs mt-2 ${isEligible ? 'text-primary' : 'text-muted'}`}>
              {isEligible ? '✓ You qualify to participate!' : `Refer ${3 - referralsCount} more to qualify`}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            <div className="bg-background rounded-lg border border-border p-3 text-center">
              <p className="font-heading font-bold text-primary">₦20,000</p>
              <p className="font-body text-xs text-muted">5 Weekly Winners</p>
            </div>
            <div className="bg-background rounded-lg border border-border p-3 text-center">
              <p className="font-heading font-bold text-accent">₦100,000</p>
              <p className="font-body text-xs text-muted">Monthly Grand Prize</p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Challenge State */
        <>
          {/* Active Theme */}
          {challenge ? (
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-body text-xs text-primary font-semibold uppercase tracking-wide">This Week's Theme</p>
                  <h3 className="font-heading font-bold text-xl text-foreground mt-1">{challenge.title}</h3>
                  {challenge.description && <p className="font-body text-sm text-muted mt-1">{challenge.description}</p>}
                  <p className="font-body text-xs text-muted mt-2">Theme: <span className="font-semibold text-foreground">{challenge.theme}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-primary text-lg">₦{challenge.prize_amount.toLocaleString()}</p>
                  <p className="font-body text-xs text-muted">per winner</p>
                  <p className="font-body text-xs text-muted mt-1">{challenge.start_date} – {challenge.end_date}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs font-body text-muted">
                <span>📌 Tag @GegoBooks</span>
                <span>📌 Use #GegoBooksChallenge</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="font-body text-sm text-muted">No active challenge this week. Check back soon!</p>
            </div>
          )}

          {/* Eligibility */}
          {!isEligible && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="font-body text-sm text-foreground font-medium">You need at least 3 referrals to participate.</p>
              <p className="font-body text-xs text-muted mt-1">Current referrals: {referralsCount}/3</p>
              <div className="w-full bg-border rounded-full h-2 mt-2">
                <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(referralsCount / 3) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Submit Content */}
          {isEligible && challenge && (
            <div>
              <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
                <Send className="w-4 h-4" /> Submit Content
              </button>
              {showForm && (
                <div className="mt-3 bg-background rounded-lg border border-border p-4 space-y-3">
                  <input placeholder="Content URL (Instagram, Facebook, etc.) *" value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
                  <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground">
                    {platforms.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  <textarea placeholder="Caption (optional)" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" rows={2} />
                  <button onClick={handleSubmit} disabled={submitting} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div>
              <p className="font-body text-sm font-semibold text-foreground mb-2">Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b.label} className="inline-flex items-center gap-1 bg-accent/10 text-accent font-body text-xs font-medium px-3 py-1 rounded-full">
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submission History */}
          {submissions.length > 0 && (
            <div>
              <p className="font-body text-sm font-semibold text-foreground mb-2">Your Submissions</p>
              <div className="space-y-2">
                {submissions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-background rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70"><ExternalLink className="w-4 h-4" /></a>
                      <div>
                        <p className="font-body text-sm text-foreground capitalize">{s.platform}</p>
                        <p className="font-body text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-body text-xs px-2 py-0.5 rounded-full capitalize ${
                        s.status === 'approved' ? 'bg-primary/10 text-primary' : s.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-muted/20 text-muted'
                      }`}>{s.status}</span>
                      {s.is_weekly_winner && <span title="Weekly Winner">🏆</span>}
                      {s.is_monthly_winner && <span title="Monthly Winner">👑</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeDashboard;
