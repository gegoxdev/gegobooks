import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import WhyNowSection from '@/components/WhyNowSection';
import WaitlistTiersSection from '@/components/WaitlistTiersSection';
import MissionSection from '@/components/MissionSection';
import FAQSection from '@/components/FAQSection';
import ChallengePromoSection from '@/components/ChallengePromoSection';
import FinalCTASection from '@/components/FinalCTASection';
import FooterSection from '@/components/FooterSection';
import SignupModal from '@/components/SignupModal';
import { useFadeUp } from '@/hooks/useFadeUp';
import { useUtmParams } from '@/hooks/useUtmParams';
import { useWaitlistStatus } from '@/hooks/useWaitlistStatus';

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const pageRef = useFadeUp();
  const utmParams = useUtmParams();
  const waitlistStatus = useWaitlistStatus();

  useEffect(() => {
    if (window.location.hash === '#waitlist-tiers') {
      setTimeout(() => {
        document.getElementById('waitlist-tiers')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen">
      <Navbar onJoinWaitlist={() => setModalOpen(true)} />
      <HeroSection onOpenModal={() => setModalOpen(true)} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <WhyNowSection />
      <WaitlistTiersSection onOpenModal={() => setModalOpen(true)} />
      <MissionSection />
      <FAQSection />
      <FinalCTASection onOpenModal={() => setModalOpen(true)} />
      <FooterSection />

      <SignupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        utmParams={utmParams}
        waitlistStatus={waitlistStatus}
      />
    </div>
  );
};

export default Index;
