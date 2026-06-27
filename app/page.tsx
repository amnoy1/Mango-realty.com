import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import FeaturedProperties from "@/components/sections/FeaturedProperties";
import AIAgentSection from "@/components/sections/AIAgentSection";
import Neighborhoods from "@/components/sections/Neighborhoods";
import HowItWorks from "@/components/sections/HowItWorks";

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <Stats />
        <FeaturedProperties />
        <AIAgentSection />
        <Neighborhoods />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}

