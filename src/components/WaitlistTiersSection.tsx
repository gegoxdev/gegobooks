interface WaitlistTiersSectionProps {
  onOpenModal: (tier: 'free' | 'priority' | 'founder') => void;
  tierCounts: { priority: { claimed: number; total: number }; founder: { claimed: number; total: number } };
}

const WaitlistTiersSection = ({ onOpenModal, tierCounts }: WaitlistTiersSectionProps) => {
  const cards = [
    {
      tier: 'priority' as const,
      title: 'Priority Waitlist',
      price: '$1 (₦1,500)',
      description: 'Jump the queue and get priority early access.',
      features: [
        'Priority access before public launch',
        'Jump ahead of the waitlist',
        'Exclusive early user updates',
        'Early adopter perks',
      ],
      cta: 'Get Priority Access',
      featured: true,
      spotsLabel: `${tierCounts.priority.claimed} / ${tierCounts.priority.total} spots claimed`,
    },
    {
      tier: 'free' as const,
      title: 'Free Waitlist',
      price: '$0',
      description: 'Perfect for anyone who wants early updates.',
      features: [
        'Access when product launches',
        'Product updates',
        'Early feature announcements',
      ],
      cta: 'Join Free Waitlist',
      featured: false,
    },
    {
      tier: 'founder' as const,
      title: 'Founder Circle',
      price: '$10 (₦15,000)',
      description: 'For the earliest believers in the future of AI accounting.',
      features: [
        'Guaranteed first access to GegoBooks',
        'Direct communication with the founder',
        'Lifetime early adopter badge',
        'Special launch perks and discounts',
        'Name listed on GegoBooks Wall of Founders',
      ],
      cta: 'Join Founder Circle',
      featured: false,
      spotsLabel: `Limited to ${tierCounts.founder.total} founding supporters.`,
      isGold: true,
    },
  ];

  return (
    <section id="waitlist-tiers" className="py-16 md:py-24 bg-soft-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up text-center mb-12">
          <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
            Join the GegoBooks Early Access List
          </h2>
          <p className="mt-4 font-body text-base text-muted">
            We're rolling out GegoBooks gradually to ensure the best experience. Join today to secure your spot.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((card, i) => (
            <div
              key={card.tier}
              className={`fade-up stagger-${i + 1} rounded-xl border p-6 flex flex-col ${
                card.featured
                  ? 'bg-surface border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]'
                  : card.isGold
                  ? 'bg-surface border-accent shadow-sm'
                  : 'bg-surface border-border shadow-sm'
              }`}
            >
              {card.featured && (
                <span className="inline-block self-start bg-primary text-primary-foreground font-body text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  Most Popular
                </span>
              )}
              {card.isGold && (
                <span className="inline-block self-start bg-accent text-accent-foreground font-body text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  ⭐ Exclusive
                </span>
              )}
              <h3 className="font-heading font-bold text-xl text-foreground">{card.title}</h3>
              <p className={`font-heading font-bold text-3xl mt-2 ${card.isGold ? 'text-accent' : 'text-primary'}`}>
                {card.price}
              </p>
              <p className="font-body text-sm text-muted mt-2">{card.description}</p>

              <ul className="mt-4 space-y-2 flex-1">
                {card.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground">
                    <span className={`font-bold mt-0.5 ${card.isGold ? 'text-accent' : 'text-primary'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onOpenModal(card.tier)}
                className={`mt-6 w-full font-body font-medium py-3 rounded-lg transition-opacity hover:opacity-90 ${
                  card.isGold
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {card.cta}
              </button>

              {card.spotsLabel && (
                <p className="mt-3 font-body text-xs text-muted text-center">{card.spotsLabel}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WaitlistTiersSection;
