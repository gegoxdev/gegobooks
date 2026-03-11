import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Send, Clock, ExternalLink, BookOpen, Award, Download } from 'lucide-react';

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
  total_score?: number;
};

type ChallengeSettings = {
  coming_soon: boolean;
  weekly_prize_amount: number;
  weekly_winner_count: number;
  monthly_prize_amount: number;
  monthly_winner_count: number;
};

type LeaderboardEntry = {
  user_name: string;
  approved_submissions: number;
  weekly_wins: number;
  monthly_wins: number;
  avg_score: number;
};

type ChallengeWeekWithAttachment = {
  id: string;
  attachment_url: string | null;
  attachment_name: string | null;
};

const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'];

const ChallengeDashboard = ({ user, waitlistData }: ChallengeDashboardProps) => {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<ChallengeSettings>({
    coming_soon: true, weekly_prize_amount: 20000, weekly_winner_count: 5,
    monthly_prize_amount: 100000, monthly_winner_count: 1,
  });
  const [form, setForm] = useState({ content_url: '', platform: 'instagram', caption: '' });
  const [showForm, setShowForm] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [attachment, setAttachment] = useState<ChallengeWeekWithAttachment | null>(null);

  const referralsCount = waitlistData?.referrals_count || 0;
  const isEligible = referralsCount >= 3;

  const fetchSettings = async () => {
    const { data } = await supabase.rpc('get_challenge_settings');
    if (data && Array.isArray(data) && data.length > 0) {
      setSettings(data[0] as ChallengeSettings);
    }
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.rpc('get_challenge_leaderboard');
    if (data) setLeaderboard(data as LeaderboardEntry[]);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [challengeRes, subsRes] = await Promise.all([
        supabase.rpc('get_active_challenge'),
        supabase.from('challenge_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      await fetchSettings();
      await fetchLeaderboard();

      if (challengeRes.data && Array.isArray(challengeRes.data) && challengeRes.data.length > 0) {
        const ch = challengeRes.data[0] as ActiveChallenge;
        setChallenge(ch);
        // Fetch attachment for this challenge
        const { data: weekData } = await supabase.from('challenge_weeks').select('id, attachment_url, attachment_name').eq('id', ch.id).single();
        if (weekData) setAttachment(weekData as ChallengeWeekWithAttachment);
      }
      if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
      setLoading(false);
    };
    fetchData();

    const settingsChannel = supabase.channel('challenge-settings-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_settings' }, () => { fetchSettings(); })
      .subscribe();

    const weeksChannel = supabase.channel('challenge-weeks-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_weeks' }, async () => {
        const { data } = await supabase.rpc('get_active_challenge');
        if (data && Array.isArray(data) && data.length > 0) {
          const ch = data[0] as ActiveChallenge;
          setChallenge(ch);
          const { data: weekData } = await supabase.from('challenge_weeks').select('id, attachment_url, attachment_name').eq('id', ch.id).single();
          if (weekData) setAttachment(weekData as ChallengeWeekWithAttachment);
        } else {
          setChallenge(null);
          setAttachment(null);
        }
      })
      .subscribe();

    const subsChannel = supabase.channel('challenge-leaderboard-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_submissions' }, () => { fetchLeaderboard(); })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(weeksChannel);
      supabase.removeChannel(subsChannel);
    };
  }, [user.id]);

  const handleSubmit = async () => {
    if (!form.content_url.trim()) { toast.error('Content URL is required'); return; }
    if (!challenge) { toast.error('No active challenge'); return; }
    if (!ageConfirmed) { toast.error('You must confirm you are 18+ to participate'); return; }
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
    const { data: subs } = await supabase.from('challenge_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (subs) setSubmissions(subs as Submission[]);
  };

  const badges = [];
  if (submissions.some(s => s.status === 'approved')) badges.push({ icon: '📝', label: 'Submitted this week' });
  if (submissions.some(s => s.is_weekly_winner)) badges.push({ icon: '🏆', label: 'Creator of the Week' });
  if (submissions.some(s => s.is_monthly_winner)) badges.push({ icon: '👑', label: 'Creator of the Month' });

  if (loading) return <div className="animate-pulse font-body text-muted p-4">Loading challenge...</div>;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Creator Challenge
        </h2>
        <button onClick={() => navigate('/challenge')} className="flex items-center gap-1 font-body text-sm text-primary hover:underline">
          <BookOpen className="w-4 h-4" /> Learn More
        </button>
      </div>

      {settings.coming_soon ? (
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-body text-sm font-semibold px-4 py-2 rounded-full">
            <Clock className="w-4 h-4" /> Coming Soon
          </div>
          <h3 className="font-heading font-bold text-xl text-foreground">The GegoBooks Creator Challenge is launching soon!</h3>
          <p className="font-body text-muted text-sm max-w-md mx-auto">
            A weekly content creation competition with cash prizes. You must be 18+ and have at least 3 referrals to qualify.
          </p>
          <div className="bg-background rounded-xl border border-border p-4 max-w-sm mx-auto">
            <p className="font-body text-sm text-muted mb-2">Your Eligibility</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`font-heading font-bold text-2xl ${isEligible ? 'text-primary' : 'text-destructive'}`}>{referralsCount}/3</span>
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
              <p className="font-heading font-bold text-primary">₦{settings.weekly_prize_amount.toLocaleString()}</p>
              <p className="font-body text-xs text-muted">{settings.weekly_winner_count} Weekly Winner{settings.weekly_winner_count > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-background rounded-lg border border-border p-3 text-center">
              <p className="font-heading font-bold text-accent">₦{settings.monthly_prize_amount.toLocaleString()}</p>
              <p className="font-body text-xs text-muted">Monthly Grand Prize</p>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                  <p className="font-heading font-bold text-primary text-lg">₦{settings.weekly_prize_amount.toLocaleString()}</p>
                  <p className="font-body text-xs text-muted">per winner ({settings.weekly_winner_count} winners)</p>
                  <p className="font-body text-xs text-muted mt-1">{challenge.start_date} – {challenge.end_date}</p>
                </div>
              </div>
              <div className="mt-3 font-body text-xs text-muted space-y-1">
                <p>📌 Tag @GegoBooks · Use #GegoBooksChallenge</p>
                <p>📊 Scoring: 30% Engagement · 40% Creativity · 30% Theme Clarity</p>
                <p>⚠️ Must be 18+ to participate</p>
              </div>
              {/* Downloadable Attachment */}
              {attachment?.attachment_url && (
                <div className="mt-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <a href={attachment.attachment_url} target="_blank" rel="noopener noreferrer" download className="font-body text-sm text-primary hover:underline font-medium">
                    Download: {attachment.attachment_name || 'Challenge Assets'}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="font-body text-sm text-muted">No active challenge this week. Check back soon!</p>
            </div>
          )}

          {!isEligible && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="font-body text-sm text-foreground font-medium">You need at least 3 referrals to participate.</p>
              <p className="font-body text-xs text-muted mt-1">Current referrals: {referralsCount}/3</p>
              <div className="w-full bg-border rounded-full h-2 mt-2">
                <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(referralsCount / 3) * 100}%` }} />
              </div>
            </div>
          )}

          {isEligible && challenge && (
            <div>
              <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
                <Send className="w-4 h-4" /> Submit Content
              </button>
              {showForm && (
                <div className="mt-3 bg-background rounded-lg border border-border p-4 space-y-3">
                  <input placeholder="Content URL (Instagram, Facebook, etc.) *" value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" />
                  <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground">
                    {platforms.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  <textarea placeholder="Caption (optional)" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="w-full font-body text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground" rows={2} />
                  <label className="flex items-center gap-2 font-body text-sm text-foreground">
                    <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} className="rounded border-border" />
                    I confirm I am 18 years or older
                  </label>
                  <button onClick={handleSubmit} disabled={submitting} className="bg-primary text-primary-foreground font-body text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          )}

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
                      {s.total_score && s.total_score > 0 && <span className="font-body text-xs text-muted">Score: {s.total_score}</span>}
                      {s.is_weekly_winner && <span title="Weekly Winner">🏆</span>}
                      {s.is_monthly_winner && <span title="Monthly Winner">👑</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div>
              <p className="font-body text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" /> Live Leaderboard — Top 10
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="font-body font-semibold text-left text-muted py-2 px-2">#</th>
                      <th className="font-body font-semibold text-left text-muted py-2 px-2">Creator</th>
                      <th className="font-body font-semibold text-center text-muted py-2 px-2">🏆</th>
                      <th className="font-body font-semibold text-center text-muted py-2 px-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={entry.user_name} className="border-b border-border/50">
                        <td className="py-2 px-2 font-heading font-bold text-foreground">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="py-2 px-2 font-body text-foreground">{entry.user_name}</td>
                        <td className="py-2 px-2 text-center font-body text-primary">{entry.weekly_wins}</td>
                        <td className="py-2 px-2 text-center font-body text-muted">{entry.avg_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeDashboard;
