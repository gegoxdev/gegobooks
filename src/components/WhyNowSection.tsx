const reasons = [
  {
    icon: '📱',
    text: 'Smartphones are becoming common across Africa',
  },
  {
    icon: '🧠',
    text: 'AI voice technology has become powerful and affordable',
  },
  {
    icon: '💼',
    text: 'Millions of businesses need better financial tools to grow',
  },
];

const WhyNowSection = () => (
  <section className="py-16 md:py-24 bg-surface">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          The timing is perfect.
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          Three things are happening right now:
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {reasons.map((r, i) => (
          <div key={i} className={`fade-up stagger-${i + 1} text-center`}>
            <div className="text-5xl mb-4">{r.icon}</div>
            <p className="font-body text-base text-foreground font-medium">{r.text}</p>
          </div>
        ))}
      </div>

      <p className="fade-up mt-12 text-center font-body text-base text-muted max-w-2xl mx-auto">
        For the first time, it's possible to build an AI accountant for everyday businesses. That's what GegoBooks is doing.
      </p>
    </div>
  </section>
);

export default WhyNowSection;
