import logo from '@/assets/gegobooks-logo.jpg';

const FooterSection = () => (
  <footer className="py-12 bg-secondary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <img src={logo} alt="GegoBooks logo" className="w-7 h-7 rounded-md" />
        <span className="font-heading font-bold text-lg text-primary">GegoBooks</span>
      </div>
      <p className="font-body text-sm text-secondary-foreground/60">
        AI Accounting for African Businesses
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 font-body text-sm text-secondary-foreground/50">
        <span>About</span>
        <span>·</span>
        <span>Contact</span>
        <span>·</span>
        <span>Privacy Policy</span>
        <span>·</span>
        <span>Terms</span>
      </div>
      <p className="mt-6 font-body text-xs text-secondary-foreground/40">
        © 2025 GegoBooks. All rights reserved.
      </p>
    </div>
  </footer>
);

export default FooterSection;
