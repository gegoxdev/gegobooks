const stats = [
  { value: '85%', label: 'of African SMEs lack proper financial records', icon: '📉' },
  { value: '₦0', label: 'affordable tools built for everyday entrepreneurs', icon: '🚫' },
  { value: '60%', label: 'of businesses fail due to poor financial management', icon: '🏦' },
];

const ProblemSection = () => (
  <section className="py-16 md:py-24 bg-soft-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          Running a business shouldn't require an accounting degree.
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          Across Africa, millions of businesses operate without proper financial records — not because they don't want to, but because the tools are too complicated.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`fade-up stagger-${i + 1} bg-surface rounded-xl shadow-sm p-6 border border-border text-center`}
          >
            <div className="text-4xl mb-3">{s.icon}</div>
            <p className="font-heading font-bold text-3xl text-primary">{s.value}</p>
            <p className="font-body text-sm text-muted mt-2">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
