import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import SignupModal from '@/components/SignupModal';
import { useUtmParams } from '@/hooks/useUtmParams';
import { useWaitlistStatus } from '@/hooks/useWaitlistStatus';
import { Trophy, Users, Share2, Send, Star, Clock, Gift, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Users, label: 'Join the Waitlist', desc: 'Sign up for the GegoBooks waitlist to get started.' },
  { icon: Share2, label: 'Refer 3 Friends', desc: 'Share your referral link and get at least 3 signups.' },
  { icon: Clock, label: 'See Weekly Theme', desc: 'Check the weekly content creation theme on your dashboard.' },
  { icon: Send, label: 'Create & Submit', desc: 'Make a post/reel, tag @GegoBooks, use #GegoBooksChallenge.' },
  { icon: Trophy, label: 'Win Prizes!', desc: '5 weekly winners get ₦20,000 each. Monthly grand prize: ₦100,000.' },
];

const prizes = [
  { icon: '🏆', title: '5 Weekly Winners', amount: '₦20,000 each', desc: 'Top content creators every week' },
  { icon: '👑', title: 'Monthly Grand Prize', amount: '₦100,000', desc: 'Best content of the month' },
  { icon: '⭐', title: 'Creator of the Week', amount: 'Badge + Feature', desc: 'Highlighted on the platform' },
  { icon: '🎖️', title: 'Creator of the Month', amount: 'Badge + Feature', desc: 'Ultimate recognition' },
];

const Challenge = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const utmParams = useUtmParams();
  const waitlistStatus = useWaitlistStatus();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onJoinWaitlist={() => setModalOpen(true)} />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-body text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-4">
            GegoBooks <span className="text-primary">Creator Challenge</span>
          </h1>
          <p className="font-body text-lg text-muted max-w-2xl mx-auto mb-8">
            A weekly content creation competition for entrepreneurs and small business owners.
            Create, share, and win cash prizes every week!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-primary-foreground font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Join the Waitlist to Participate
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-surface border border-border text-foreground font-body font-semibold px-8 py-3 rounded-lg hover:bg-muted/10 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
            The Challenge is Coming Soon!
          </h2>
          <p className="font-body text-muted max-w-lg mx-auto">
            We're preparing an exciting weekly content challenge. Join the waitlist now to be
            the first to know when it launches and to qualify for participation.
          </p>
        </div>
      </section>

      {/* Prizes */}
      <section className="px-4 py-16 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10">
            Prizes & Recognition
          </h2>
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

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-10">
            How It Works
          </h2>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-start gap-4 bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <s.icon className="w-4 h-4 text-primary" />
                    {s.label}
                  </h3>
                  <p className="font-body text-sm text-muted mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="px-4 py-16 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground text-center mb-8">
            Challenge Rules
          </h2>
          <div className="space-y-3">
            {[
              'Weekly challenges run Monday–Sunday.',
              'You must be on the waitlist and have at least 3 referrals to qualify.',
              'Create a post or reel based on the weekly theme.',
              'Tag @GegoBooks and use hashtag #GegoBooksChallenge.',
              'Submit your content link through your dashboard.',
              '5 weekly winners are selected (by engagement or admin choice).',
              '1 monthly grand prize is awarded for the best content of the month.',
              'Submissions are archived weekly.',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 bg-background rounded-lg p-4 border border-border">
                <Star className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="font-body text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-foreground mb-4">
            Ready to Compete?
          </h2>
          <p className="font-body text-muted mb-6">
            Join the waitlist today and be the first to know when the GegoBooks Creator Challenge launches.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-primary-foreground font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Join the Waitlist Now
          </button>
        </div>
      </section>

      <FooterSection />
      <SignupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} utmParams={utmParams} waitlistStatus={waitlistStatus} />
    </div>
  );
};

export default Challenge;
