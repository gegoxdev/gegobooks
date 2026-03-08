import { useState } from 'react';
import logo from '@/assets/gegobooks-logo.png';

const FooterSection = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <footer className="py-12 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <img src={logo} alt="GegoBooks logo" className="w-7 h-7 rounded-md" />
                <span className="font-heading font-bold text-lg text-primary">GegoBooks</span>
              </div>
              <p className="font-body text-sm text-secondary-foreground/60">AI Accounting for African Businesses</p>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-heading font-semibold text-sm text-secondary-foreground mb-3">Contact</h4>
              <div className="space-y-2 font-body text-sm text-secondary-foreground/60">
                <p className="font-semibold text-secondary-foreground/80">Kingsley (Founder/CEO)</p>
                <p>WhatsApp: <a href="https://wa.me/2348053511386" className="hover:text-primary transition-colors">+234 805 351 1386</a></p>
                <p>Email: <a href="mailto:kingsleycumejiego@gmail.com" className="hover:text-primary transition-colors">kingsleycumejiego@gmail.com</a></p>
                <div className="mt-3">
                  <p className="font-semibold text-secondary-foreground/80">Customer Support</p>
                  <p>Call/WhatsApp: <a href="https://wa.me/2348120084316" className="hover:text-primary transition-colors">+234 812 008 4316</a></p>
                  <p>Email: <a href="mailto:gegobooks@gmail.com" className="hover:text-primary transition-colors">gegobooks@gmail.com</a></p>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-heading font-semibold text-sm text-secondary-foreground mb-3">Legal</h4>
              <div className="space-y-2 font-body text-sm text-secondary-foreground/60">
                <button onClick={() => setShowPrivacy(true)} className="block hover:text-primary transition-colors">Privacy Policy</button>
                <button onClick={() => setShowTerms(true)} className="block hover:text-primary transition-colors">Terms of Service</button>
              </div>
              <h4 className="font-heading font-semibold text-sm text-secondary-foreground mt-5 mb-3">Follow Us</h4>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <a href="https://www.facebook.com/gegobooks" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://www.instagram.com/gegobooks" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com/company/gegobooks" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/60 hover:text-primary transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/10 pt-6 text-center">
            <p className="font-body text-xs text-secondary-foreground/40">
              © 2026 GegoBooks. All rights reserved. Powered by{' '}
              <a href="https://gegotics.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Gegotics Ltd</a>
              {' '}— AI software solutions for Africa and the world.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowPrivacy(false)}>
          <div className="absolute inset-0 bg-secondary/60" />
          <div className="relative bg-surface w-full max-w-2xl mx-4 rounded-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 text-muted hover:text-foreground text-2xl">×</button>
            <h2 className="font-heading font-bold text-xl text-foreground mb-1">GegoBooks Privacy Policy</h2>
            <p className="font-body text-xs text-muted mb-6">Last updated: March 2026</p>
            <div className="font-body text-sm text-foreground space-y-4 leading-relaxed">
              <p>GegoBooks ('we', 'us', or 'our') is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you join our waitlist or interact with our platform.</p>
              <h3 className="font-heading font-semibold text-base">Information We Collect</h3>
              <p>When you join the GegoBooks waitlist, we collect your full name, email address, phone number (if provided), business type, country, and referral information. We may also collect device and usage data automatically through analytics tools.</p>
              <h3 className="font-heading font-semibold text-base">How We Use Your Information</h3>
              <p>We use your information to manage your waitlist position and communicate updates about the GegoBooks launch, send tier-related communications and early access invitations, process payments for paid waitlist tiers (Founder Circle and Priority Waitlist), personalise your experience based on your user type (Business Owner or Accountant), and improve our product through aggregated analytics.</p>
              <h3 className="font-heading font-semibold text-base">Referral Data</h3>
              <p>If you refer others to the waitlist, we track referral counts linked to your account to calculate rewards and leaderboard rankings. Referral data is not shared publicly beyond your rank position.</p>
              <h3 className="font-heading font-semibold text-base">Data Sharing</h3>
              <p>We do not sell your personal data. We may share data with trusted service providers solely to operate the waitlist and platform. All third-party providers are required to protect your data in line with applicable laws.</p>
              <h3 className="font-heading font-semibold text-base">Account Deletion & Data Retention</h3>
              <p>You may request deletion of your account at any time from your dashboard. Upon requesting deletion, your account will be marked for removal and your data will be retained for a period of <strong>30 days</strong> (the industry-standard retention period). During this 30-day window, you may cancel the deletion request and restore your account. After the 30-day retention period expires, all personal data associated with your account — including your name, email, waitlist position, referral data, and payment history — will be permanently and irreversibly deleted from our systems. Certain anonymised or aggregated data that cannot be used to identify you may be retained for analytics purposes.</p>
              <h3 className="font-heading font-semibold text-base">Your Rights</h3>
              <p>You have the right to access, correct, or delete your personal data. You may also withdraw consent or unsubscribe from communications at any time. You can request account deletion directly from your dashboard or by emailing gegobooks@gmail.com.</p>
              <h3 className="font-heading font-semibold text-base">Contact</h3>
              <p>For privacy-related inquiries, email gegobooks@gmail.com.</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowTerms(false)}>
          <div className="absolute inset-0 bg-secondary/60" />
          <div className="relative bg-surface w-full max-w-2xl mx-4 rounded-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTerms(false)} className="absolute top-4 right-4 text-muted hover:text-foreground text-2xl">×</button>
            <h2 className="font-heading font-bold text-xl text-foreground mb-1">GegoBooks Waitlist Terms of Service</h2>
            <p className="font-body text-xs text-muted mb-6">Last updated: March 2026</p>
            <div className="font-body text-sm text-foreground space-y-4 leading-relaxed">
              <p>By joining the GegoBooks waitlist, you agree to the following terms.</p>
              <h3 className="font-heading font-semibold text-base">1. Eligibility</h3>
              <p>The waitlist is open to individuals and businesses interested in using GegoBooks for bookkeeping and financial management. You must be at least 18 years old to join.</p>
              <h3 className="font-heading font-semibold text-base">2. Waitlist Tiers</h3>
              <p>GegoBooks offers multiple waitlist tiers, including a free tier and paid priority access tiers. The names, benefits, and pricing of each tier are as displayed on the GegoBooks waitlist page. Paid tiers are processed securely via Paystack. All payments are final unless otherwise stated. Upgrading to a paid tier moves you up in the waitlist and grants the benefits associated with that tier as described at the time of payment.</p>
              <h3 className="font-heading font-semibold text-base">3. Referrals</h3>
              <p>Referring others to the waitlist may improve your position and qualify you for rewards. GegoBooks reserves the right to modify or discontinue the referral programme at any time.</p>
              <h3 className="font-heading font-semibold text-base">4. Early Access</h3>
              <p>Joining the waitlist does not guarantee a specific launch date or feature availability. GegoBooks will communicate access timelines as the product develops.</p>
              <h3 className="font-heading font-semibold text-base">5. Account Responsibility</h3>
              <p>You are responsible for maintaining the accuracy of your account information. Do not share your login credentials with others.</p>
              <h3 className="font-heading font-semibold text-base">6. Account Deletion</h3>
              <p>You may request deletion of your account at any time through your dashboard settings. Upon requesting deletion: (a) your account will be deactivated immediately; (b) your personal data will be retained for 30 days to allow you to cancel the deletion and recover your account; (c) after the 30-day retention period, all personal data will be permanently deleted; (d) certain anonymised analytics data may be retained indefinitely. GegoBooks reserves the right to retain data required by law or necessary to resolve disputes, enforce agreements, or protect legal interests, even after an account deletion request.</p>
              <h3 className="font-heading font-semibold text-base">7. Acceptable Use</h3>
              <p>You agree not to misuse the platform, attempt to manipulate waitlist rankings artificially, or engage in fraudulent referral activity. GegoBooks reserves the right to remove accounts that violate these terms.</p>
              <h3 className="font-heading font-semibold text-base">8. Intellectual Property</h3>
              <p>All content, branding, and technology associated with GegoBooks is the intellectual property of GegoBooks and may not be reproduced without written permission.</p>
              <h3 className="font-heading font-semibold text-base">9. Limitation of Liability</h3>
              <p>GegoBooks is provided on an 'as available' basis during the waitlist period. We are not liable for any loss or damage arising from your use of or inability to access the waitlist platform.</p>
              <h3 className="font-heading font-semibold text-base">10. Changes to Terms</h3>
              <p>GegoBooks may update these terms at any time. Continued use of the waitlist constitutes acceptance of the updated terms.</p>
              <h3 className="font-heading font-semibold text-base">11. Governing Law</h3>
              <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
              <p>Contact: For questions about these terms, email gegobooks@gmail.com.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FooterSection;
