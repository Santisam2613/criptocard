import HeroSection from "./sections/HeroSection";
import GetYourCardTodaySection from "./sections/GetYourCardTodaySection";
import FreeTopUpSection from "./sections/FreeTopUpSection";
import SpendWithFullControlSection from "./sections/SpendWithFullControlSection";
import DarkFeaturesFaqSection from "./sections/DarkFeaturesFaqSection";
import Footer from "./sections/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent">
      <HeroSection />
      <GetYourCardTodaySection />
      <FreeTopUpSection />
      <SpendWithFullControlSection />
      <DarkFeaturesFaqSection />
      <Footer />
    </main>
  );
}
