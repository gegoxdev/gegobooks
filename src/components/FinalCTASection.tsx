interface FinalCTASectionProps {
  onOpenModal: (tier: 'free' | 'priority' | 'founder') => void;
}

const FinalCTASection = ({ onOpenModal }: FinalCTASectionProps) => (
  <section className="py-16 md:py-24 bg-primary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="fade-up">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-primary-foreground">
          The future of business accounting in Africa starts here.
        </h2>
        <p className="mt-4 font-body text-lg text-primary-foreground/80">
          Join the waitlist today.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenModal('free')}
            className="w-full sm:w-auto bg-surface text-primary font-body font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Join Free Waitlist
          </button>
          <button
            onClick={() => onOpenModal('priority')}
            className="w-full sm:w-auto border-2 border-primary-foreground text-primary-foreground font-body font-medium px-8 py-3 rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            Get Priority Access — $1
          </button>
          <button
            onClick={() => onOpenModal('founder')}
            className="w-full sm:w-auto border-2 border-accent text-accent font-body font-medium px-8 py-3 rounded-full hover:bg-accent/10 transition-colors"
          >
            Join Founder Circle — $10
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCTASection;
