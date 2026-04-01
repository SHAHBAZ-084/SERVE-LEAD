import Navbar from "../components/Navbar";
import StatsSection from "../components/StatsSection";
import TeamSection from "../components/TeamSection";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Premium Page Header */}
      <section className="relative py-20 md:py-32 bg-slate-950 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-block text-cyan-400 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs mb-4 md:mb-6 animate-fade-in">
             Our Leadership & Members
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 md:mb-8 leading-tight tracking-tighter animate-fade-up">
            About Our <span className="gradient-text italic font-serif">Society</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed md:leading-loose font-medium animate-fade-up">
            The SLS is dedicated to building elite leaders through professional service and career excellence. Our vision is to empower the next generation of Pakistan.
          </p>
        </div>
      </section>

      <StatsSection />
      <TeamSection />
      <Footer />
    </>
  );
}
