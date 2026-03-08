const pillars = [
  { icon: '📊', title: 'Understand Numbers', description: 'Help businesses see their real financial picture' },
  { icon: '🧭', title: 'Better Decisions', description: 'Data-driven insights lead to smarter choices' },
  { icon: '🌍', title: 'Stronger Economies', description: 'Stronger businesses build stronger communities' },
];

const MissionSection = () => (
  <section className="py-16 md:py-24 bg-secondary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="blur-in text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-secondary-foreground">
          Built for the next generation of African businesses.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {pillars.map((p, i) => (
          <div key={p.title} className={`fade-up stagger-${i + 1} text-center`}>
            <div className="w-14 h-14 mx-auto bg-secondary-foreground/10 rounded-2xl flex items-center justify-center text-3xl mb-3">
              {p.icon}
            </div>
            <h3 className="font-heading font-bold text-lg text-secondary-foreground">{p.title}</h3>
            <p className="font-body text-sm text-secondary-foreground/70 mt-1">{p.description}</p>
          </div>
        ))}
      </div>

      <p className="fade-up mt-10 text-center font-body text-sm text-secondary-foreground/60 italic max-w-xl mx-auto">
        Built by entrepreneurs who understand the challenges of running a business in Africa.
      </p>
    </div>
  </section>
);

export default MissionSection;
