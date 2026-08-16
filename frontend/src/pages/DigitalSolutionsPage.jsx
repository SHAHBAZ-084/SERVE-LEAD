import { useEffect, useState } from "react";
import {
  Code2,
  Smartphone,
  Monitor,
  ShoppingCart,
  Layers,
  Cpu,
  Cloud,
  Palette,
  Mail,
  MessageCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import asHeroBanner from "../assets/digital-solutions/as-hero-banner.jpeg";

const SERVICES = [
  {
    name: "Websites",
    desc: "Fast, modern sites built for growth, clarity, and conversion.",
    icon: Code2,
  },
  {
    name: "Mobile Apps",
    desc: "Native-feel Android & iOS apps tailored to your workflows.",
    icon: Smartphone,
  },
  {
    name: "Desktop Applications",
    desc: "Reliable Windows and cross-platform tools for daily operations.",
    icon: Monitor,
  },
  {
    name: "POS & Business Systems",
    desc: "Point-of-sale and ops systems that keep commerce running smoothly.",
    icon: ShoppingCart,
  },
  {
    name: "Custom Software",
    desc: "Bespoke platforms designed around your exact business process.",
    icon: Layers,
  },
  {
    name: "AI & ML Solutions",
    desc: "Intelligent automation, insights, and AI-powered product features.",
    icon: Cpu,
  },
  {
    name: "Cloud Solutions",
    desc: "Scalable cloud architecture, hosting, and deployment pipelines.",
    icon: Cloud,
  },
  {
    name: "UI/UX Design",
    desc: "Clean interfaces and journeys that feel simple and intentional.",
    icon: Palette,
  },
];

export default function DigitalSolutionsPage() {
  const [contact, setContact] = useState({ email: "", whatsapp: "" });

  useEffect(() => {
    api
      .get("settings/digital-solutions-contact")
      .then((r) =>
        setContact({
          email: r.data.email || "",
          whatsapp: r.data.whatsapp || "",
        })
      )
      .catch(() => setContact({ email: "", whatsapp: "" }));
  }, []);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const waDigits = String(contact.whatsapp).replace(/\D/g, "");

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* HERO — same pattern as Home: full bg image + white wash for clear text */}
      <section
        className="relative min-h-[85vh] flex flex-col items-center justify-center text-center bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${asHeroBanner})` }}
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/65 to-white/90" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-cyan-300/10 rounded-full blur-3xl animate-float delay-400" />

        <div className="relative z-10 px-6 max-w-4xl w-full py-24">
          <div className="glass p-10 md:p-16 flex flex-col items-center animate-fade-up">
            <span className="px-5 py-2 rounded-full bg-cyan-50 border border-cyan-200/60 text-cyan-700 text-xs font-black tracking-widest uppercase mb-8 shadow-sm">
              Serve and Lead Society&apos;s Digital Solutions Wing
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tighter">
              We Build Digital Solutions That{" "}
              <span className="gradient-text">Drive Business Forward</span>
            </h1>

            <p className="text-base md:text-xl text-slate-600 mb-10 font-medium max-w-2xl leading-relaxed">
              From POS systems to websites, desktop apps to AI tools — if it&apos;s software, we build it.
            </p>

            <button
              type="button"
              onClick={scrollToContact}
              className="btn-pulse bg-slate-900 text-white px-10 py-5 rounded-3xl text-xs font-black tracking-widest uppercase hover:bg-cyan-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-slate-900/20"
            >
              Talk to Us
            </button>
          </div>
        </div>
      </section>

      {/* SERVICES — OurMission-style section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-up">
            <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">
              What We Build
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
              Full-stack digital <span className="gradient-text">services</span>
            </h2>
            <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
              End-to-end product work — from idea and design to shipping and support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="bg-white p-8 md:p-10 flex flex-col items-center text-center card-hover group transition-all duration-500 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100"
                >
                  <div className="w-16 h-16 text-emerald-600 bg-emerald-50 border-emerald-200 rounded-2xl flex items-center justify-center mb-6 border group-hover:scale-110 transition-all duration-500 shadow-xl">
                    <Icon className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-3">{service.name}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">
                    {service.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl -z-10" />
      </section>

      {/* ABOUT */}
      <section className="py-20 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-50/50 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 animate-fade-up">
          <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">
            About the Wing
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-8">
            Built by the team behind this platform
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-[1.8] font-medium mb-6">
            AS Digital Solutions is Serve and Lead Society&apos;s in-house technical wing — the same team
            that builds and runs this very platform. Led by Ali &amp; Shahbaz, we now build for
            organizations and businesses beyond SLS too.
          </p>
          <p className="text-slate-800 text-base md:text-lg font-black leading-relaxed">
            Have a product idea? Talk to us — we build it end to end.
          </p>
        </div>
      </section>

      {/* CONTACT — ContactUsSection pattern */}
      <section id="contact" className="py-20 md:py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-50 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/60 animate-fade-up">
            <div className="text-center mb-10 md:mb-12">
              <span className="text-cyan-600 font-black tracking-widest uppercase text-[10px] md:text-xs mb-3 block">
                Get in Touch
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
                Let&apos;s build <span className="gradient-text">something</span>
              </h2>
              <p className="text-slate-500 mt-4 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Reach AS Digital Solutions by email or WhatsApp — we&apos;ll help turn your idea into a shipped product.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 hover:-translate-y-1.5 transition-all duration-500 shadow-xl shadow-slate-900/20"
                >
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              ) : (
                <span className="text-slate-400 text-sm font-medium">Email coming soon</span>
              )}
              {waDigits ? (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border-2 border-slate-900 text-slate-900 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:-translate-y-1.5 transition-all duration-500 bg-white"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
