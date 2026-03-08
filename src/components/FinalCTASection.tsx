interface FinalCTASectionProps {
  onOpenModal: () => void;
}

const FinalCTASection = ({ onOpenModal }: FinalCTASectionProps) => (
  <section className="py-16 md:py-24 bg-primary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="blur-in">
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-primary-foreground">
          The future of business accounting in Africa starts here.
        </h2>
        <p className="mt-4 font-body text-lg text-primary-foreground/80">
          Join the waitlist today.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenModal}
            className="w-full sm:w-auto bg-surface text-primary font-body font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Join the Waitlist — It's Free
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCTASection;
