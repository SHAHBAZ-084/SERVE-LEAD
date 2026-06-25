import { useState, useEffect, useCallback } from "react";
import bg from "../assets/bg2.jpeg";
import useScrollReveal from "../hooks/useScrollReveal";
import api from "../api";
import { parseAboutSettings, parseAboutTags } from "../constants/aboutDefaults";

export default function AboutSection() {
  const ref = useScrollReveal();
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
    <section
      ref={ref}
      id="about"
      className="relative py-20 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
        <div className="reveal">
          <span className="inline-block bg-cyan-100 text-cyan-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            {about.about_badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-cyan-600 mb-2">{about.about_title}</h2>
          <p className="italic font-semibold text-gray-700 text-lg">
            &ldquo;{about.about_subtitle}&rdquo;
          </p>
        </div>

        <div className="reveal delay-200 mt-10 text-gray-700 leading-relaxed text-base space-y-6">
          <p>{about.about_paragraph_1}</p>
          <p>{about.about_paragraph_2}</p>
        </div>

        {tags.length > 0 && (
          <div className="reveal delay-400 flex flex-wrap justify-center gap-3 mt-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-white/80 border border-cyan-200 text-cyan-700 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm hover:bg-cyan-50 hover:scale-105 transition-all duration-200 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
