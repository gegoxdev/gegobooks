const features = [
  {
    icon: '🎙️',
    title: 'Voice Bookkeeping',
    description: 'Simply speak your transactions and GegoBooks records them automatically. No typing required.',
  },
  {
    icon: '📊',
    title: 'Smart Financial Reports',
    description: 'Instantly see your profit, expenses, cash flow, and overall business performance.',
  },
  {
    icon: '🤖',
    title: 'AI Business Insights',
    description: "Get helpful alerts like 'Your expenses increased 15% this week' or 'Your best-selling product this month is rice.'",
  },
  {
    icon: '🌍',
    title: 'Built for African Businesses',
    description: 'Designed specifically for traders, retail shops, market sellers, and small business owners across Africa.',
  },
];

const FeaturesSection = () => (
  <section className="py-16 md:py-24 bg-soft-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center mb-12">
        <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-2">
          Your AI Financial Assistant
        </p>
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          Everything your business needs to manage money.
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`${i % 2 === 0 ? 'fade-left' : 'fade-right'} stagger-${Math.min(i + 1, 4)} bg-surface rounded-xl shadow-sm border border-border p-6`}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">{f.title}</h3>
            <p className="font-body text-sm text-muted">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
