import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onOpenModal: (tier: 'free' | 'priority' | 'founder') => void;
}

const checkItems = [
  'Sale recorded',
  'Profit updated',
  'Inventory tracked',
  'Report generated',
];

const HeroSection = ({ onOpenModal }: HeroSectionProps) => {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    const timers = checkItems.map((_, i) =>
      setTimeout(() => setVisibleItems(i + 1), 800 + i * 400)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-heading font-bold text-3xl md:text-5xl text-foreground max-w-4xl mx-auto leading-tight">
          Accounting your business can understand. Just talk.
        </h1>
        <p className="mt-6 font-body text-base md:text-lg text-muted max-w-xl mx-auto">
          GegoBooks is a voice-first AI accounting assistant that helps African businesses record sales, track expenses, and understand their finances — simply by speaking. No spreadsheets. No accounting knowledge required.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenModal('free')}
            className="w-full sm:w-auto bg-primary text-primary-foreground font-body font-medium px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Join the Free Waitlist
          </button>
          <button
            onClick={() => onOpenModal('priority')}
            className="w-full sm:w-auto border-2 border-accent text-accent font-body font-medium px-8 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Get Priority Access — $1 (₦1,500)
          </button>
        </div>

        <p className="mt-4 text-sm text-muted font-body">
          Join 3,000+ early users waiting for launch
        </p>

        {/* Animated demo card */}
        <div className="mt-12 max-w-md mx-auto bg-surface rounded-2xl shadow-lg p-6 text-left border border-border">
          <div className="bg-soft-white rounded-xl px-4 py-3 mb-4 inline-block max-w-[80%]">
            <p className="font-body text-sm text-foreground">
              "Sold 5 bags of rice for ₦75,000"
            </p>
          </div>

          <div className="space-y-2">
            {checkItems.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 transition-all duration-500 ${
                  i < visibleItems
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <span className="text-primary font-bold">✓</span>
                <span className="font-body text-sm text-primary font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
