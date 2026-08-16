import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import api from "../../api";

export default function FloatingWhatsAppButton() {
  const location = useLocation();
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    api
      .get("settings/digital-solutions-contact")
      .then((r) => setWhatsapp(r.data.whatsapp || ""))
      .catch(() => setWhatsapp(""));
  }, []);

  const isDashboard = location.pathname.includes("/dashboard");
  const isAdminPortal = location.pathname.includes("/admin-portal");
  if (isDashboard || isAdminPortal) return null;

  const digits = String(whatsapp).replace(/\D/g, "");
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-36 right-6 md:bottom-28 md:right-8 z-[9999] group"
      aria-label="Contact AS Digital Solutions on WhatsApp"
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 group-hover:hidden" />
        <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 active:scale-95">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.25} />
        </div>
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Digital Solutions
          </p>
        </div>
      </div>
    </a>
  );
}
