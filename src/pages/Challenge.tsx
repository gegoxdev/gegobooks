import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import SignupModal from '@/components/SignupModal';
import { useUtmParams } from '@/hooks/useUtmParams';
import { useWaitlistStatus } from '@/hooks/useWaitlistStatus';
import { Trophy, Users, Share2, Send, Star, Clock, Gift, ArrowRight, Award } from 'lucide-react';

const steps = [
  { icon: Users, label: 'Join the Waitlist', desc: 'Sign up for the GegoBooks waitlist to get started.' },
  { icon: Share2, label: 'Refer 3 Friends', desc: 'Share your referral link and get at least 3 signups.' },
  { icon: Clock, label: 'See Weekly Theme', desc: 'Check the weekly content creation theme on your dashboard.' },
  { icon: Send, label: 'Create & Submit', desc: 'Make a post/reel, tag @GegoBooks, use #GegoBooksChallenge.' },
  { icon: Trophy, label: 'Win Prizes!', desc: 'Top weekly winners get cash prizes. Monthly grand prize for the best!' },
];

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

const Challenge = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [settings, setSettings] = useState<ChallengeSettings>({
    coming_soon: true, weekly_prize_amount: 20000, weekly_winner_count: 5,
    monthly_prize_amount: 100000, monthly_winner_count: 1,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const navigate = useNavigate();
  const utmParams = useUtmParams();
  const waitlistStatus = useWaitlistStatus();

  useEffect(() => {
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
    fetchSettings();
    fetchLeaderboard();

    const channel = supabase.channel('challenge-settings-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_settings' }, () => { fetchSettings(); })
      .subscribe();

    const subsChannel = supabase.channel('challenge-leaderboard-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_submissions' }, () => { fetchLeaderboard(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(subsChannel); };
  }, []);

  const handleJoinChallenge = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login?redirect=challenge');
    }
  };

  const prizes = [
    { icon: '🏆', title: `${settings.weekly_winner_count} Weekly Winner${settings.weekly_winner_count > 1 ? 's' : ''}`, amount: `₦${settings.weekly_prize_amount.toLocaleString()} each`, desc: 'Top content creators every week' },
    { icon: '👑', title: `Monthly Grand Prize`, amount: `₦${settings.monthly_prize_amount.toLocaleString()}`, desc: 'Best content of the month' },
    { icon: '⭐', title: 'Creator of the Week', amount: 'Badge + Feature', desc: 'Highlighted on the platform' },
    { icon: '🎖️', title: 'Creator of the Month', amount: 'Badge + Feature', desc: 'Ultimate recognition' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onJoinWaitlist={() => setModalOpen(true)} />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {settings.coming_soon && (
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-body text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Clock className="w-4 h-4" /> Coming Soon
            </div>
          )}
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-4">
            GegoBooks <span className="text-primary">Creator Challenge</span>
          </h1>
          <p className="font-body text-lg text-muted max-w-2xl mx-auto mb-8">
            A weekly content creation competition for entrepreneurs and small business owners.
            Create, share, and win cash prizes every week! Must be 18+ to participate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleJoinChallenge} className="bg-primary text-primary-foreground font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {settings.coming_soon ? 'Join the Waitlist to Participate' : 'Participate Now'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      {settings.coming_soon && (
        <section className="px-4 pb-12">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">The Challenge is Coming Soon!</h2>
            <p className="font-body text-muted max-w-lg mx-auto">
              We're preparing an exciting weekly content challenge. Join the waitlist now to be the first to know when it launches.
            </p>
          </div>
        </section>
      )}

      {/* Prizes */}
      <section className="px-4 py-16 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10">Prizes & Recognition</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {prizes.map((p) => (
              <div key={p.title} className="bg-background rounded-xl border border-border p-6 text-center hover:border-primary/30 transition-colors">
                <span className="text-4xl block mb-3">{p.icon}</span>
                <h3 className="font-heading font-bold text-foreground mb-1">{p.title}</h3>
                <p className="font-heading font-extrabold text-primary text-xl mb-2">{p.amount}</p>
                <p className="font-body text-sm text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10 flex items-center justify-center gap-2">
              <Award className="w-8 h-8 text-accent" /> Live Leaderboard — Top 10
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-body font-semibold text-left text-muted py-3 px-3">#</th>
                    <th className="font-body font-semibold text-left text-muted py-3 px-3">Creator</th>
                    <th className="font-body font-semibold text-center text-muted py-3 px-3">Submissions</th>
                    <th className="font-body font-semibold text-center text-muted py-3 px-3">🏆 Weekly</th>
                    <th className="font-body font-semibold text-center text-muted py-3 px-3">👑 Monthly</th>
                    <th className="font-body font-semibold text-center text-muted py-3 px-3">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.user_name} className={`border-b border-border/50 ${i < 3 ? 'bg-accent/5' : ''}`}>
                      <td className="py-3 px-3 font-heading font-bold text-foreground">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-3 px-3 font-body text-foreground font-medium">{entry.user_name}</td>
                      <td className="py-3 px-3 text-center font-body text-muted">{entry.approved_submissions}</td>
                      <td className="py-3 px-3 text-center font-heading font-bold text-primary">{entry.weekly_wins}</td>
                      <td className="py-3 px-3 text-center font-heading font-bold text-accent">{entry.monthly_wins}</td>
                      <td className="py-3 px-3 text-center font-body text-foreground">{entry.avg_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="px-4 py-16 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10">How It Works</h2>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-start gap-4 bg-background rounded-xl border border-border p-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm shrink-0">{i + 1}</div>
                <div>
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <s.icon className="w-4 h-4 text-primary" /> {s.label}
                  </h3>
                  <p className="font-body text-sm text-muted mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-8">Challenge Rules</h2>
          <div className="space-y-3">
            {[
              'You must be 18 years or older to participate.',
              'Weekly challenges run Monday–Sunday.',
              'You must be on the waitlist and have at least 3 referrals to qualify.',
              'Create a post or reel based on the weekly theme.',
              'Tag @GegoBooks and use hashtag #GegoBooksChallenge.',
              'Submit your content link through your dashboard.',
              `Winners are selected based on: 30% Engagement, 40% Creativity, 30% Weekly Theme Clarity.`,
              `${settings.weekly_winner_count} weekly winner${settings.weekly_winner_count > 1 ? 's are' : ' is'} selected each week (₦${settings.weekly_prize_amount.toLocaleString()} each).`,
              `${settings.monthly_winner_count} monthly grand prize winner${settings.monthly_winner_count > 1 ? 's are' : ' is'} chosen from the best weekly submissions (₦${settings.monthly_prize_amount.toLocaleString()}).`,
              'Submissions are archived weekly.',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface rounded-lg p-4 border border-border">
                <Star className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="font-body text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center bg-surface">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground mb-4">Ready to Compete?</h2>
          <p className="font-body text-muted mb-6">
            {settings.coming_soon
              ? 'Join the waitlist today and be the first to know when the GegoBooks Creator Challenge launches.'
              : 'Sign in and head to your dashboard to submit your content!'}
          </p>
          <button onClick={handleJoinChallenge} className="bg-primary text-primary-foreground font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
            {settings.coming_soon ? 'Join the Waitlist Now' : 'Go to Dashboard'}
          </button>
        </div>
      </section>

      <FooterSection />
      <SignupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} utmParams={utmParams} waitlistStatus={waitlistStatus} />
    </div>
  );
};

export default Challenge;
