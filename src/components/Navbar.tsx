import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/gegobooks-logo.png';

interface NavbarProps {
  onJoinWaitlist: () => void;
}

const Navbar = ({ onJoinWaitlist }: NavbarProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleJoinWaitlist = () => {
    setMenuOpen(false);
    onJoinWaitlist();
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setIsLoggedIn(false);
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
          <span className="font-heading font-bold text-xl text-primary">GegoBooks</span>
          <span className="text-lg">🎙️</span>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="font-body font-medium text-sm text-foreground hover:text-primary transition-colors px-3 py-2"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="font-body text-sm text-muted hover:text-destructive transition-colors px-3 py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="font-body font-medium text-sm text-foreground hover:text-primary transition-colors px-3 py-2"
            >
              Sign In
            </button>
          )}
          <button
            onClick={handleJoinWaitlist}
            className="bg-primary text-primary-foreground font-body font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Join Waitlist
          </button>
        </div>

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
        <div className="md:hidden bg-surface shadow-lg px-4 py-4 space-y-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}
                className="w-full text-left font-body font-medium text-sm text-foreground hover:text-primary transition-colors py-2"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left font-body text-sm text-muted hover:text-destructive transition-colors py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); navigate('/login'); }}
              className="w-full text-left font-body font-medium text-sm text-foreground hover:text-primary transition-colors py-2"
            >
              Sign In
            </button>
          )}
          <button
            onClick={handleJoinWaitlist}
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
