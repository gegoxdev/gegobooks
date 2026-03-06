const autoActions = [
  'Records the transaction',
  'Updates your daily sales',
  'Tracks expenses',
  'Calculates profit',
  'Generates financial reports',
];

const SolutionSection = () => (
  <section className="py-16 md:py-24 bg-surface">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up max-w-3xl mx-auto text-center">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          GegoBooks makes accounting as simple as talking.
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          With GegoBooks, you don't need to learn accounting software. Just speak naturally.
        </p>
      </div>

      <div className="fade-up mt-12 max-w-lg mx-auto">
        <div className="bg-soft-white rounded-2xl p-6 border border-border">
          <p className="font-body text-sm text-muted mb-2">You say:</p>
          <div className="bg-primary/10 rounded-xl px-4 py-3 mb-6 inline-block">
            <p className="font-body font-medium text-primary">"Sold bread ₦3,000"</p>
          </div>

          <p className="font-body text-sm text-muted mb-3">GegoBooks automatically:</p>
          <ul className="space-y-2">
            {autoActions.map((action) => (
              <li key={action} className="flex items-center gap-2 font-body text-sm text-foreground">
                <span className="text-primary font-bold">✓</span> {action}
              </li>
            ))}
          </ul>

          <p className="mt-6 font-body text-sm text-muted italic">
            All in seconds. No spreadsheets. No complicated menus. Just talk.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default SolutionSection;
