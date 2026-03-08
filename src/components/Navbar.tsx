import { useState, useEffect } from 'react';
import logo from '@/assets/gegobooks-logo.jpg';

interface NavbarProps {
  onJoinWaitlist: () => void;
}

const Navbar = ({ onJoinWaitlist }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleJoinWaitlist = () => {
    setMenuOpen(false);
    onJoinWaitlist();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-surface shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <img src={logo} alt="GegoBooks logo" className="w-8 h-8 rounded-md" />
          <span className="font-heading font-bold text-xl text-primary">
            GegoBooks
          </span>
          <span className="text-lg">🎙️</span>
        </div>

        {/* Desktop */}
        <button
          onClick={handleJoinWaitlist}
          className="hidden md:inline-flex bg-primary text-primary-foreground font-body font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Join Waitlist
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-surface shadow-lg px-4 py-4">
          <button
            onClick={scrollToTiers}
            className="w-full bg-primary text-primary-foreground font-body font-medium px-5 py-3 rounded-lg"
          >
            Join Waitlist
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
