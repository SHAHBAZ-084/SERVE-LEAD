import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import StatsSection from "../components/StatsSection";
import TeamSection from "../components/TeamSection";
import Footer from "../components/Footer";
import bgPhoto from "../assets/facebook.jpg";
import api from "../api";
import { parseAboutSettings, parseAboutTags } from "../constants/aboutDefaults";

export default function AboutPage() {
  const [about, setAbout] = useState(() => parseAboutSettings());
  const tags = parseAboutTags(about.about_tags);

  const loadAboutSettings = useCallback(async () => {
    try {
      const r = await api.get("settings", { params: { _t: Date.now() } });
      setAbout(parseAboutSettings(r.data));
    } catch (err) {
      console.error("Failed to load about settings:", err);
    }
  }, []);

  useEffect(() => {
    loadAboutSettings();
    window.addEventListener("focus", loadAboutSettings);
    return () => window.removeEventListener("focus", loadAboutSettings);
  }, [loadAboutSettings]);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={bgPhoto} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/80 to-white/95 sm:from-white/60 sm:via-white/70" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 blur-[120px] rounded-full -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-50/50 blur-[100px] rounded-full -ml-48 -mb-48" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <span className="bg-cyan-100/60 backdrop-blur-md text-cyan-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-sm shadow-cyan-100/50 animate-fade-in">
              {about.about_badge}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#002147] mb-2 tracking-tighter animate-fade-up">
            {about.about_title}
          </h1>

          <p className="text-slate-500 font-serif italic text-lg md:text-xl mb-16 animate-fade-up">
            &ldquo;{about.about_subtitle}&rdquo;
          </p>

          <div className="space-y-12 max-w-4xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-cyan-600 mb-8 uppercase tracking-tight">
                {about.about_section_heading}
              </h2>
              <div className="space-y-8">
                <p className="text-slate-600 text-base md:text-lg leading-[1.8] font-medium animate-fade-up">
                  {about.about_paragraph_1}
                </p>
                <p className="text-slate-600 text-base md:text-lg leading-[1.8] font-medium animate-fade-up delay-200">
                  {about.about_paragraph_2}
                </p>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 pt-6 animate-fade-up delay-300">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-6 py-2.5 bg-white border border-cyan-100/50 text-cyan-700 rounded-full text-[11px] font-bold shadow-xl shadow-cyan-900/5 hover:-translate-y-1 transition-all cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <StatsSection />
      <TeamSection />
      <Footer />
    </div>
  );
}
