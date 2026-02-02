import HeroSection from "@/components/HeroSection";
import GetYourCardTodaySection from "@/components/GetYourCardTodaySection";
import FreeTopUpSection from "@/components/FreeTopUpSection";
import SpendWithFullControlSection from "@/components/SpendWithFullControlSection";
import DarkFeaturesFaqSection from "@/components/DarkFeaturesFaqSection";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <HeroSection />
      <GetYourCardTodaySection />
      <FreeTopUpSection />
      <SpendWithFullControlSection />
      <DarkFeaturesFaqSection />
    </main>
  );
}
