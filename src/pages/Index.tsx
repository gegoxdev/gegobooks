import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [selectedTier, setSelectedTier] = useState<'free' | 'priority' | 'founder'>('free');
  const [tierCounts, setTierCounts] = useState({
    priority: { claimed: 0, total: 1000 },
    founder: { claimed: 0, total: 100 },
  });
  const pageRef = useFadeUp();
  const utmParams = useUtmParams();

  const fetchTierCounts = async () => {
    const { data } = await supabase.from('tier_counts').select('*');
    if (data) {
      const counts: Record<string, { claimed: number; total: number }> = {};
      data.forEach((row) => {
        counts[row.id] = { claimed: row.claimed, total: row.total };
      });
      if (counts.priority && counts.founder) {
        setTierCounts({ priority: counts.priority, founder: counts.founder });
      }
    }
  };

  useEffect(() => {
    fetchTierCounts();
  }, []);

  const openModal = (tier: 'free' | 'priority' | 'founder') => {
    setSelectedTier(tier);
    setModalOpen(true);
  };

  return (
    <div ref={pageRef} className="min-h-screen">
      <Navbar onJoinWaitlist={() => openModal('free')} />
      <HeroSection onOpenModal={openModal} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <WhyNowSection />
      <WaitlistTiersSection onOpenModal={openModal} tierCounts={tierCounts} />
      <MissionSection />
      <FAQSection />
      <FinalCTASection onOpenModal={openModal} />
      <FooterSection />

      <SignupModal
        isOpen={modalOpen}
        tier={selectedTier}
        onClose={() => setModalOpen(false)}
        utmParams={utmParams}
        onSignupComplete={fetchTierCounts}
      />
    </div>
  );
};

export default Index;
