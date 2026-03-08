const steps = [
  { step: '1', icon: '🎙️', title: 'Speak', description: '"Sold bread ₦3,000"' },
  { step: '2', icon: '🤖', title: 'AI Processes', description: 'Transaction recorded instantly' },
  { step: '3', icon: '✅', title: 'Accountants Review', description: 'Verified for accuracy & compliance' },
  { step: '4', icon: '📊', title: 'See Results', description: 'Clean, verified financial reports' },
  { step: '5', icon: '📈', title: 'Grow', description: 'Better decisions & growth' },
];

const SolutionSection = () => (
  <section className="py-16 md:py-24 bg-surface">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          GegoBooks makes accounting as simple as talking.
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          No spreadsheets. No complicated menus. Just speak naturally.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.step} className={`fade-up stagger-${Math.min(i + 1, 4)} text-center`}>
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-3">
              {s.icon}
            </div>
            <div className="inline-block bg-primary text-primary-foreground font-heading text-xs font-bold px-2 py-0.5 rounded-full mb-2">
              Step {s.step}
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground">{s.title}</h3>
            <p className="font-body text-sm text-muted mt-1">{s.description}</p>
          </div>
        ))}
      </div>

      <p className="fade-up mt-10 text-center font-body text-sm text-muted italic max-w-lg mx-auto">
        All in seconds. No accounting knowledge required. Just talk.
      </p>
    </div>
  </section>
);

export default SolutionSection;
