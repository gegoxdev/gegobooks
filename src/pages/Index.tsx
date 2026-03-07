import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import WhyNowSection from '@/components/WhyNowSection';
import WaitlistTiersSection from '@/components/WaitlistTiersSection';
import MissionSection from '@/components/MissionSection';
import FAQSection from '@/components/FAQSection';
import FinalCTASection from '@/components/FinalCTASection';
import FooterSection from '@/components/FooterSection';
import SignupModal from '@/components/SignupModal';
import { useFadeUp } from '@/hooks/useFadeUp';
import { useUtmParams } from '@/hooks/useUtmParams';

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const pageRef = useFadeUp();
  const utmParams = useUtmParams();

  return (
    <div ref={pageRef} className="min-h-screen">
      <Navbar onJoinWaitlist={() => setModalOpen(true)} />
      <HeroSection onOpenModal={() => setModalOpen(true)} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <WhyNowSection />
      <WaitlistTiersSection />
      <MissionSection />
      <FAQSection />
      <FinalCTASection onOpenModal={() => setModalOpen(true)} />
      <FooterSection />

      <SignupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        utmParams={utmParams}
      />
    </div>
  );
};

export default Index;
