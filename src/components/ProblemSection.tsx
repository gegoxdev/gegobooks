const painPoints = [
  {
    icon: '📉',
    title: 'No financial clarity',
    description: 'Most business owners don\'t know their exact profit or where their money goes.',
  },
  {
    icon: '🚫',
    title: 'Tools too complex',
    description: 'Existing accounting software was built for accountants, not everyday entrepreneurs.',
  },
  {
    icon: '🏦',
    title: 'Blocked from growth',
    description: 'Without records, businesses can\'t access loans, plan expansion, or make smart decisions.',
  },
];

const ProblemSection = () => (
  <section className="py-16 md:py-24 bg-soft-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="fade-up text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
          Running a business shouldn't require an accounting degree.
        </h2>
        <p className="mt-6 font-body text-base text-muted leading-relaxed">
          Across Africa, millions of businesses operate without proper financial records — not because they don't want to, but because the tools are too complicated. Accounting software was designed for accountants. Not for traders. Not for shop owners. Not for everyday entrepreneurs. So most businesses end up operating blindly — not knowing their exact profit, where their money went, or whether their business is actually growing. This makes it harder to access loans, plan growth, or make smart decisions.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {painPoints.map((point, i) => (
          <div
            key={point.title}
            className={`fade-up stagger-${i + 1} bg-surface rounded-xl shadow-sm p-6 border border-border text-center`}
          >
            <div className="text-4xl mb-4">{point.icon}</div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">{point.title}</h3>
            <p className="font-body text-sm text-muted">{point.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
