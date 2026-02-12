import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import SolutionsSection from "@/components/landing/SolutionsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import CTASection from "@/components/landing/CTASection";
import DelhiJaipurBanner from "@/components/landing/DelhiJaipurBanner";

import PromoBanner from "@/components/landing/PromoBanner";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <DelhiJaipurBanner />
        <SolutionsSection />
        <FeaturesSection />
        <IntegrationsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
