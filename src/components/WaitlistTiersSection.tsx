const cards = [
  {
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
    href: 'https://paystack.com/pay/gegobooks-priority',
    recommended: false,
  },
  {
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
    href: 'https://paystack.com/pay/gegobooks-founder',
    recommended: true,
  },
];

const WaitlistTiersSection = () => (
  <section id="waitlist-tiers" className="py-16 md:py-24 bg-soft-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          Want to skip the line?
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          Get early access and exclusive perks by joining a paid tier.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className={`fade-up stagger-${i + 1} rounded-xl border p-6 flex flex-col ${
              card.recommended
                ? 'bg-surface border-accent shadow-lg ring-2 ring-accent/20'
                : 'bg-surface border-primary shadow-sm ring-2 ring-primary/20'
            }`}
          >
            {card.recommended && (
              <span className="inline-block self-start bg-accent text-accent-foreground font-body text-xs font-semibold px-3 py-1 rounded-full mb-3">
                ⭐ Recommended
              </span>
            )}
            <h3 className="font-heading font-bold text-xl text-foreground">{card.title}</h3>
            <p className={`font-heading font-bold text-3xl mt-2 ${card.recommended ? 'text-accent' : 'text-primary'}`}>
              {card.price}
            </p>
            <p className="font-body text-sm text-muted mt-2">{card.description}</p>

            <ul className="mt-4 space-y-2 flex-1">
              {card.features.map((f) => (
                <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground">
                  <span className={`font-bold mt-0.5 ${card.recommended ? 'text-accent' : 'text-primary'}`}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 w-full font-body font-medium py-3 rounded-lg transition-opacity hover:opacity-90 text-center block ${
                card.recommended
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {card.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WaitlistTiersSection;
