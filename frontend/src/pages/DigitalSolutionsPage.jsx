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
import asLogo from "../assets/digital-solutions/as-logo.jpeg";
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
    <div className="bg-slate-900 min-h-screen">
      <Navbar />

      {/* HERO — theme image fills the right plane, blends into slate */}
      <section className="relative min-h-[88vh] lg:min-h-[92vh] overflow-hidden bg-slate-900 flex items-center">
        {/* Theme image: full right half, edge-to-edge */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[58%] z-0">
          <img
            src={asHeroBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-[62%_center] lg:object-[55%_center]"
          />
          {/* Soft emerald cast so blues sit with site accent */}
          <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply" />
          {/* Fade into slate on the left so copy stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-900/25 lg:via-slate-900/70 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40 lg:to-slate-900/20" />
        </div>

        {/* Mobile theme wash behind content */}
        <div className="absolute inset-0 z-0 lg:hidden bg-slate-900/55" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-xl animate-fade-up">
            {/* Logo — full mark, object-contain (no square crop) */}
            <div className="mb-8 inline-flex items-center">
              <img
                src={asLogo}
                alt="AS Digital Solutions"
                className="h-14 md:h-16 w-auto max-w-[220px] md:max-w-[260px] object-contain rounded-lg"
                style={{
                  filter: "hue-rotate(72deg) saturate(0.85) brightness(1.05)",
                }}
              />
            </div>

            <p className="text-emerald-400 font-black tracking-widest uppercase text-[10px] md:text-xs mb-4">
              Serve and Lead Society&apos;s Digital Solutions Wing
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
              We Build Digital Solutions That Drive Business Forward
            </h1>
            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed mb-10 max-w-lg">
              From POS systems to websites, desktop apps to AI tools — if it&apos;s software, we build it.
            </p>
            <button
              type="button"
              onClick={scrollToContact}
              className="btn-pulse bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-emerald-900/40"
            >
              Talk to Us
            </button>
          </div>
        </div>
      </section>

      {/* SERVICES — open grid, no gray/white card boxes */}
      <section className="py-20 md:py-24 bg-slate-900 relative overflow-hidden border-t border-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="absolute -top-32 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14 md:mb-16 animate-fade-up">
            <span className="text-emerald-400 font-black tracking-widest uppercase text-xs mb-3 block">
              What We Build
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Full-stack digital services
            </h2>
            <p className="text-slate-400 mt-5 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              End-to-end product work — from idea and design to shipping and support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="flex flex-col items-start text-left group transition-all duration-300"
                >
                  <div className="mb-4 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base md:text-lg font-black text-white mb-2 tracking-tight">
                    {service.name}
                  </h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    {service.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 md:py-24 bg-slate-800/60 relative border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6 text-center animate-fade-up">
          <span className="text-emerald-400 font-black tracking-widest uppercase text-xs mb-3 block">
            About the Wing
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-8">
            Built by the team behind this platform
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium mb-6">
            AS Digital Solutions is Serve and Lead Society&apos;s in-house technical wing — the same team
            that builds and runs this very platform. Led by Ali &amp; Shahbaz, we now build for
            organizations and businesses beyond SLS too.
          </p>
          <p className="text-emerald-400 text-base md:text-lg font-black leading-relaxed">
            Have a product idea? Talk to us — we build it end to end.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 md:py-24 bg-slate-900 relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <img
            src={asHeroBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
            style={{ filter: "hue-rotate(70deg) saturate(0.6) brightness(0.35)" }}
          />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="text-emerald-400 font-black tracking-widest uppercase text-xs mb-3 block">
            Get in Touch
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Let&apos;s build something
          </h2>
          <p className="text-slate-400 mt-4 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Reach AS Digital Solutions by email or WhatsApp — we&apos;ll help turn your idea into a shipped product.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-emerald-900/30"
              >
                <Mail className="w-4 h-4" /> {contact.email}
              </a>
            ) : (
              <span className="text-slate-500 text-sm font-medium">Email coming soon</span>
            )}
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 border-2 border-emerald-500 text-emerald-400 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:-translate-y-1.5 transition-all duration-500"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
