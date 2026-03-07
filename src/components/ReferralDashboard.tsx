import { useState } from 'react';

const milestones = [
  { count: 3, reward: 'Move up 10 spots', icon: '🚀' },
  { count: 10, reward: 'Priority access', icon: '⭐' },
  { count: 25, reward: 'Free 3 months', icon: '🎁' },
  { count: 50, reward: 'Founder badge', icon: '👑' },
];

interface ReferralDashboardProps {
  referralCode: string;
  waitlistPosition: number;
  referralsCount: number;
  onClose: () => void;
}

const ReferralDashboard = ({ referralCode, waitlistPosition, referralsCount, onClose }: ReferralDashboardProps) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://gegobooks.lovable.app?ref=${referralCode}`;
  const shareText = `I just joined the GegoBooks waitlist — the AI accounting assistant for African businesses! Join me: ${referralLink}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center space-y-6">
      <div className="text-5xl">🎉</div>
      <div>
        <p className="font-heading font-bold text-xl text-primary">You're on the list!</p>
        <p className="font-body text-sm text-muted mt-1">Your position: <span className="font-bold text-foreground">#{waitlistPosition}</span></p>
      </div>

      {/* Referral link */}
      <div className="bg-soft-white rounded-xl p-4 border border-border">
        <p className="font-body text-sm text-muted mb-2">Share & move up the list</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 font-body text-xs bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
          />
          <button
            onClick={copyLink}
            className="bg-primary text-primary-foreground font-body text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex justify-center gap-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[hsl(145,83%,34%)] text-primary-foreground font-body text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90"
        >
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-secondary text-secondary-foreground font-body text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90"
        >
          X / Twitter
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-accent-foreground font-body text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90"
        >
          Telegram
        </a>
      </div>

      {/* Milestone tracker */}
      <div className="text-left">
        <p className="font-body text-sm font-semibold text-foreground mb-3">Referral Milestones</p>
        <div className="space-y-2">
          {milestones.map((m) => {
            const unlocked = referralsCount >= m.count;
            return (
              <div
                key={m.count}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                  unlocked ? 'bg-primary/10 border-primary/30' : 'bg-soft-white border-border opacity-60'
                }`}
              >
                <span className="text-lg">{unlocked ? m.icon : '🔒'}</span>
                <div className="flex-1">
                  <p className="font-body text-xs font-medium text-foreground">{m.reward}</p>
                  <p className="font-body text-[10px] text-muted">{m.count} referrals</p>
                </div>
                {unlocked && <span className="text-primary font-bold text-xs">✓</span>}
              </div>
            );
          })}
        </div>
        <p className="font-body text-xs text-muted mt-2 text-center">
          You have <span className="font-bold text-foreground">{referralsCount}</span> referral{referralsCount !== 1 ? 's' : ''}
        </p>
      </div>

      <button
        onClick={onClose}
        className="bg-primary text-primary-foreground font-body font-medium px-6 py-2 rounded-lg"
      >
        Done
      </button>
    </div>
  );
};

export default ReferralDashboard;
