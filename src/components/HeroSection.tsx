import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onOpenModal: () => void;
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
        <h1 className="blur-in font-heading font-bold text-3xl md:text-5xl text-foreground max-w-4xl mx-auto leading-tight">
          Accounting your business can understand. Just talk.
        </h1>
        <p className="fade-up stagger-2 mt-6 font-body text-base md:text-lg text-muted max-w-xl mx-auto">
          GegoBooks is a voice-first AI accounting assistant that helps African businesses record sales, track expenses, and understand their finances — simply by speaking.
        </p>

        <div className="fade-up stagger-3 mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenModal}
            className="w-full sm:w-auto bg-primary text-primary-foreground font-body font-medium px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Join the Waitlist — It's Free
          </button>
        </div>

        <p className="fade-up stagger-4 mt-4 text-sm text-muted font-body">
          Join 3,000+ early users waiting for launch
        </p>

        <div className="mt-12 max-w-md mx-auto bg-surface rounded-2xl shadow-lg p-6 text-left border border-border">
          {/* Voice note chat bubble */}
          <div className="bg-soft-white rounded-2xl px-4 py-3 mb-4 max-w-[85%] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm">🎙️</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-[2px] items-end h-4">
                  {[3, 6, 4, 8, 5, 10, 7, 4, 9, 6, 3, 7, 5, 8, 4, 6, 10, 5, 3, 7].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-primary/60"
                      style={{ height: `${h * 1.5}px` }}
                    />
                  ))}
                </div>
                <span className="font-body text-[10px] text-muted ml-auto">0:03</span>
              </div>
              <p className="font-body text-sm text-foreground font-medium">"Sold 5 bags of rice for ₦75,000"</p>
            </div>
          </div>
          <div className="space-y-2">
            {checkItems.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 transition-all duration-500 ${
                  i < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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
