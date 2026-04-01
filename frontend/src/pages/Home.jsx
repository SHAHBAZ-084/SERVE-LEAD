// src/pages/Home.jsx
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import StatsSection from "../components/StatsSection";
import OurMission from "../components/OurMission";
import ChairmanHomeSection from "../components/ChairmanHomeSection";
import EventsSection from "../components/EventsSection";
import AnnouncementsHome from "../components/AnnouncementsHome";
import ContactUsSection from "../components/ContactUsSection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Immersive Welcome Area */}
      <HeroSection />

      {/* Social Proof & Trust */}
      <StatsSection theme="dark" />

      {/* Core DNA & Mission */}
      <OurMission />

      {/* Leadership & Vision */}
      <ChairmanHomeSection />

      {/* Dynamic Society Life Highlights */}
      <div id="events">
        <EventsSection />
      </div>

      {/* Connection & Support Hub */}
      <div id="contact">
        <ContactUsSection />
      </div>

      {/* Premium Multi-Section Footer */}
      <Footer />
    </div>
  );
}