import { useState, useEffect } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type ChallengeSettings = {
  coming_soon: boolean;
  weekly_prize_amount: number;
  weekly_winner_count: number;
  monthly_prize_amount: number;
  monthly_winner_count: number;
};

const ChallengePromoSection = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ChallengeSettings>({
    coming_soon: true, weekly_prize_amount: 20000, weekly_winner_count: 5,
    monthly_prize_amount: 100000, monthly_winner_count: 1,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.rpc('get_challenge_settings');
      if (data && Array.isArray(data) && data.length > 0) {
        setSettings(data[0] as ChallengeSettings);
      }
    };
    fetchSettings();

    const channel = supabase.channel('challenge-settings-promo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_settings' }, () => { fetchSettings(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-2xl border border-primary/20 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-body text-sm font-semibold px-3 py-1 rounded-full mb-4">
                <Trophy className="w-4 h-4" />
                {settings.coming_soon ? 'Coming Soon' : 'Live Now! 🔥'}
              </div>
              <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-foreground leading-tight mb-4">
                GegoBooks <span className="text-primary">Creator Challenge</span>
              </h2>
              <p className="font-body text-muted mb-6">
                Join our weekly content creation competition. Create posts about
                entrepreneurship and accounting, and win cash prizes every week! Must be 18+.
              </p>
              <button
                onClick={() => navigate('/challenge')}
                className="bg-primary text-primary-foreground font-body font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl border border-border p-5 text-center">
                <p className="text-3xl mb-1">🏆</p>
                <p className="font-heading font-bold text-primary text-lg">₦{settings.weekly_prize_amount.toLocaleString()}</p>
                <p className="font-body text-xs text-muted">{settings.weekly_winner_count} Weekly Winner{settings.weekly_winner_count > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-5 text-center">
                <p className="text-3xl mb-1">👑</p>
                <p className="font-heading font-bold text-accent text-lg">₦{settings.monthly_prize_amount.toLocaleString()}</p>
                <p className="font-body text-xs text-muted">{settings.monthly_winner_count} Monthly Winner{settings.monthly_winner_count > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-5 text-center">
                <p className="text-3xl mb-1">⭐</p>
                <p className="font-heading font-bold text-foreground">Badges</p>
                <p className="font-body text-xs text-muted">Recognition</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-5 text-center">
                <p className="text-3xl mb-1">🔗</p>
                <p className="font-heading font-bold text-foreground">Referrals</p>
                <p className="font-body text-xs text-muted">3 to qualify</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChallengePromoSection;
