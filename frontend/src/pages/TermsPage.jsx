import { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsPage() {
  const [tnc, setTnc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTnc = async () => {
      try {
        const res = await api.get("settings/terms");
        setTnc(res.data.terms || "Terms and Conditions are currently being updated.");
      } catch (err) {
        console.error("Error fetching T&C:", err);
        setTnc("Unable to load Terms and Conditions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchTnc();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-[#FAFBFD] py-16 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#002147]/5 rounded-full blur-[150px] -mr-80 -mt-80" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[150px] -ml-80 -mb-80" />
        
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] md:rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] p-8 md:p-16 border border-slate-100 relative z-10">
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">Terms & <span className="text-[#002147]">Conditions</span></h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[2px] w-12 bg-[#002147]" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em]">Official Society Guidelines</p>
              <div className="h-[2px] w-12 bg-[#002147]" />
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            {loading ? (
              <div className="flex flex-col items-center py-20">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-[#002147] rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Legal Content...</p>
              </div>
            ) : (
              <div className="text-slate-600 leading-relaxed space-y-6 whitespace-pre-wrap font-medium">
                {tnc}
              </div>
            )}
          </div>

          <div className="mt-16 pt-12 border-t border-slate-50 flex flex-col items-center opacity-40">
            <div className="w-16 h-1 bg-[#002147] mb-4" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">Security Verification: SLS Official Documentation</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
