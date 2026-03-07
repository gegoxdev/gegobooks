const reasons = [
  { icon: '📱', stat: '500M+', title: 'Smartphone users in Africa', description: 'Mobile-first is the only way forward' },
  { icon: '🧠', stat: '10x', title: 'Cheaper AI voice tech', description: 'Powerful AI is now affordable for everyone' },
  { icon: '💼', stat: '40M+', title: 'African SMEs need tools', description: 'A massive underserved market ready to grow' },
];

const WhyNowSection = () => (
  <section className="py-16 md:py-24 bg-surface">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          The timing is perfect.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {reasons.map((r, i) => (
          <div key={i} className={`fade-up stagger-${i + 1} bg-soft-white rounded-xl border border-border p-6 text-center`}>
            <div className="text-4xl mb-3">{r.icon}</div>
            <p className="font-heading font-bold text-2xl text-primary">{r.stat}</p>
            <h3 className="font-heading font-bold text-base text-foreground mt-1">{r.title}</h3>
            <p className="font-body text-sm text-muted mt-1">{r.description}</p>
          </div>
        ))}
      </div>

      <p className="fade-up mt-10 text-center font-body text-base text-muted max-w-2xl mx-auto">
        For the first time, it's possible to build an AI accountant for everyday businesses. That's what GegoBooks is doing.
      </p>
    </div>
  </section>
);

export default WhyNowSection;
