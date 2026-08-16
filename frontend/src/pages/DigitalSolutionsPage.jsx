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
  ArrowDownRight,
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

      {/* HERO — split composition (not Home glass center) */}
      <section className="relative min-h-[88vh] grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">
        {/* Copy plane */}
        <div className="relative z-10 lg:col-span-5 flex items-center px-6 sm:px-10 lg:px-12 xl:px-16 py-20 lg:py-0 bg-white">
          <div className="w-full max-w-lg animate-fade-up">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-10 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                Serve and Lead Society&apos;s Digital Solutions Wing
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-[3.35rem] font-black text-slate-900 leading-[1.08] tracking-tight mb-6">
              We Build Digital Solutions That{" "}
              <span className="text-emerald-600">Drive Business</span> Forward
            </h1>

            <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium mb-10 border-l-2 border-emerald-200 pl-5">
              From POS systems to websites, desktop apps to AI tools — if it&apos;s software, we build it.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToContact}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:gap-3 transition-all duration-300 shadow-lg shadow-emerald-600/25"
              >
                Talk to Us
                <ArrowDownRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors"
              >
                Explore services →
              </button>
            </div>
          </div>
        </div>

        {/* Theme image plane — full height, no boxed card */}
        <div className="relative lg:col-span-7 min-h-[42vh] lg:min-h-full">
          <img
            src={asHeroBanner}
            alt="Digital solutions product mockups"
            className="absolute inset-0 w-full h-full object-cover object-[58%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent lg:via-white/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent lg:hidden" />
          <div className="absolute bottom-8 left-6 right-6 lg:left-auto lg:right-10 lg:bottom-10 lg:max-w-xs">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white drop-shadow-md bg-slate-900/55 backdrop-blur-sm px-4 py-3 rounded-xl inline-block">
              Built by the SLS tech wing
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES — numbered rows, not Home mission cards */}
      <section id="services" className="py-20 md:py-28 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-emerald-600 font-black tracking-[0.25em] uppercase text-[10px] mb-3">
                Capabilities
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Eight ways we ship software
              </h2>
            </div>
            <p className="text-slate-500 max-w-md text-sm md:text-base leading-relaxed font-medium">
              End-to-end product work — from idea and design to shipping and support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {SERVICES.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="group flex gap-5 py-7 border-b border-slate-100 hover:border-emerald-200 transition-colors"
                >
                  <span className="text-[11px] font-black text-emerald-600/80 tracking-widest pt-1 w-8 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" strokeWidth={2} />
                      <h3 className="text-lg font-black text-slate-900">{service.name}</h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{service.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT — editorial split */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-slate-50">
        <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block opacity-[0.12]">
          <img src={asHeroBanner} alt="" aria-hidden="true" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-emerald-600 font-black tracking-[0.25em] uppercase text-[10px] mb-4">
              About the Wing
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
              The same team that builds and runs this platform.
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-[1.85] font-medium mb-6">
              AS Digital Solutions is Serve and Lead Society&apos;s in-house technical wing.
              Led by Ali &amp; Shahbaz, we now build for organizations and businesses beyond SLS too.
            </p>
            <p className="text-slate-900 text-base md:text-lg font-black leading-relaxed">
              Have a product idea? Talk to us — we build it end to end.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT — emerald band, distinct from site contact card */}
      <section id="contact" className="relative py-20 md:py-24 bg-emerald-600 overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img
            src={asHeroBanner}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover mix-blend-luminosity"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-xl">
            <p className="text-emerald-100 font-black tracking-[0.25em] uppercase text-[10px] mb-3">
              Start a project
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              Let&apos;s build something
            </h2>
            <p className="text-emerald-50/90 text-base leading-relaxed font-medium">
              Reach AS Digital Solutions by email or WhatsApp — we&apos;ll help turn your idea into a shipped product.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
              >
                <Mail className="w-4 h-4" /> Email
              </a>
            ) : (
              <span className="text-emerald-100 text-sm font-medium self-center">Email coming soon</span>
            )}
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-emerald-700 transition-all duration-300"
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
