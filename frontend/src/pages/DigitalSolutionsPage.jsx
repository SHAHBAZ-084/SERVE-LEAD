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
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-up">
              <div className="relative inline-block mb-8">
                <img
                  src={asLogo}
                  alt="AS Digital Solutions"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border border-slate-700 shadow-xl"
                  style={{
                    filter: "grayscale(0.35) saturate(0.7) brightness(0.92) hue-rotate(85deg)",
                    opacity: 0.9,
                  }}
                />
                <div className="absolute inset-0 rounded-2xl bg-slate-900/25 pointer-events-none" />
              </div>

              <p className="text-emerald-500 font-black tracking-widest uppercase text-[10px] md:text-xs mb-4">
                Serve and Lead Society&apos;s Digital Solutions Wing
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
                We Build Digital Solutions That Drive Business Forward
              </h1>
              <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl">
                From POS systems to websites, desktop apps to AI tools — if it&apos;s software, we build it.
              </p>
              <button
                type="button"
                onClick={scrollToContact}
                className="btn-pulse bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-emerald-900/30"
              >
                Talk to Us
              </button>
            </div>

            <div className="relative animate-fade-up delay-200">
              <div className="rounded-[2rem] overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/40 bg-slate-800">
                <img
                  src={asHeroBanner}
                  alt="AS Digital Solutions product mockup"
                  className="w-full h-64 sm:h-80 lg:h-[26rem] object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-up">
            <span className="text-emerald-600 font-black tracking-widest uppercase text-xs mb-3 block">
              What We Build
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
              Full-stack digital services
            </h2>
            <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
              End-to-end product work — from idea and design to shipping and support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="bg-white p-8 flex flex-col items-center text-center card-hover group transition-all duration-500 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100"
                >
                  <div className="w-16 h-16 text-emerald-600 bg-emerald-50 border-emerald-200 rounded-2xl flex items-center justify-center mb-6 border group-hover:scale-110 transition-all duration-500 shadow-xl">
                    <Icon className="w-8 h-8" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-3">{service.name}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl -z-10" />
      </section>

      {/* ABOUT */}
      <section className="py-20 md:py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-6 text-center animate-fade-up">
          <span className="text-emerald-600 font-black tracking-widest uppercase text-xs mb-3 block">
            About the Wing
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-8">
            Built by the team behind this platform
          </h2>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-6">
            AS Digital Solutions is Serve and Lead Society&apos;s in-house technical wing — the same team
            that builds and runs this very platform. Led by Ali &amp; Shahbaz, we now build for
            organizations and businesses beyond SLS too.
          </p>
          <p className="text-slate-800 text-base md:text-lg font-black leading-relaxed">
            Have a product idea? Talk to us — we build it end to end.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 md:py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="text-emerald-500 font-black tracking-widest uppercase text-xs mb-3 block">
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
