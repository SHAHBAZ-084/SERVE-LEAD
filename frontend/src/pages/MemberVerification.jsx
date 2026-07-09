import { useState, useEffect } from "react";
import { ShieldCheck, Search, Loader2, AlertCircle, CheckCircle2, Award } from "lucide-react";
import api, { getImgUrl } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { signatureImg, stampImg, MEMBERSHIP_TEMPLATE_ID, enrichCertificateData } from "./CertTemplates";
import MembershipCertificateExact from "./MembershipCertificateExact";
import { captureCertificatePdf, captureCertificatePng } from "../utils/certificatePdfExport";

export default function MemberVerification() {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [membershipCert, setMembershipCert] = useState(null);
  const [error, setError] = useState("");
  const [exportData, setExportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [certAssets, setCertAssets] = useState({ logo: null, signature: null, stamp: null });

  useEffect(() => {
    const loadToDataURL = async (url, key) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setCertAssets((prev) => ({ ...prev, [key]: reader.result }));
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(`Failed to load ${key}:`, err);
      }
    };
    loadToDataURL("/logo-certificate.png", "logo");
    loadToDataURL(signatureImg, "signature");
    loadToDataURL(stampImg, "stamp");
  }, []);

  const downloadCert = async (format = "pdf") => {
    if (!membershipCert) return;
    const enriched = enrichCertificateData(
      {
        ...membershipCert,
        memberId: {
          name: result.name,
          member_id: result.member_id,
          joining_year: result.joining_year,
          role: result.role,
        },
      },
      { session: result.joining_year }
    );
    setExportData(enriched);
    setExporting(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const name = result.name.replace(/\s+/g, "_");
      if (format === "png") {
        await captureCertificatePng("verify-cert-export", { fileName: `SLS_Membership_${name}.png` });
      } else {
        await captureCertificatePdf("verify-cert-export", { fileName: `SLS_Membership_${name}.pdf` });
      }
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
      setExportData(null);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!memberId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setMembershipCert(null);

    try {
      const cleanId = memberId.trim().replace(/[\s.]/g, "-").toUpperCase();
      const response = await api.get(`auth/verify/${cleanId}`);
      setResult(response.data.member);
      setMembershipCert(response.data.membershipCertificate || null);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid ID. No official member found with this ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm mb-6"
            >
              <ShieldCheck className="text-cyan-500 w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Official Verification System</span>
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Verify <span className="text-cyan-500">Membership</span>
            </h1>
            <p className="text-slate-500 max-w-md mx-auto font-medium">
              Validate the authenticity of any Serve & Lead Society member or certificate using their official SLS ID.
            </p>
          </div>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 md:p-12 border border-white"
          >
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block ml-2">
                  Enter Membership ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. 2026-SLS-0001"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl px-5 py-4 md:px-8 md:py-6 text-base md:text-xl text-slate-900 placeholder:text-slate-300 focus:border-cyan-500 focus:bg-white outline-none transition-all pr-14 md:pr-20 font-bold tracking-wider"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors">
                    <Search size={28} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !memberId.trim()}
                className="w-full bg-slate-900 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 text-base md:text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Verifying Database...
                  </>
                ) : (
                  "Verify Now"
                )}
              </button>
            </form>

            {/* Dynamic Results Section */}
            <div className="mt-12">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl md:rounded-[2rem] p-6 md:p-8"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                      <div className="relative shrink-0">
                        <img
                          src={getImgUrl(result.profile_pic_url) || "https://ui-avatars.com/api/?name=" + result.name + "&size=256&background=10b981&color=fff"}
                          alt={result.name}
                          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover border-4 border-white shadow-md"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2 border-4 border-white shadow-sm">
                          <CheckCircle2 size={24} />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="inline-block bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                          Verified Member
                        </div>
                        <h4 className="text-emerald-900 font-black text-3xl leading-tight uppercase tracking-tight mb-1">
                          {result.name}
                        </h4>
                        <p className="text-emerald-700 font-bold uppercase tracking-widest text-sm">
                          {result.role === 'General' ? 'Official Society Member' : result.role}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="bg-white/50 px-4 py-2 rounded-xl text-emerald-800 text-xs font-black">
                                JOINED: {result.joining_year}
                            </div>
                            <div className="bg-white/50 px-4 py-2 rounded-xl text-emerald-800 text-xs font-black uppercase">
                                STATUS: ACTIVE
                            </div>
                        </div>
                      </div>
                    </div>

                    {membershipCert && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-white border-2 border-[#c8a951]/40 rounded-2xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Award className="text-[#002147]" size={22} />
                          <div>
                            <h5 className="font-black text-[#002147] uppercase tracking-tight text-sm">
                              Membership Certificate Verified
                            </h5>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Official Certificate of Membership on file
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center mb-5">
                          <div className="bg-slate-50 rounded-xl py-3 px-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Session</p>
                            <p className="text-sm font-black text-[#002147] mt-1">{result.joining_year}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl py-3 px-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                            <p className="text-sm font-black text-emerald-600 mt-1">Active</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl py-3 px-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Issued</p>
                            <p className="text-xs font-black text-[#002147] mt-1">
                              {new Date(membershipCert.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => downloadCert("pdf")}
                            disabled={exporting}
                            className="flex-1 bg-[#002147] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
                          >
                            Download PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadCert("png")}
                            disabled={exporting}
                            className="flex-1 bg-[#1ba3e0] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-50"
                          >
                            Download PNG
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-8 flex flex-col items-center text-center gap-4 text-rose-800"
                  >
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle className="text-rose-500" size={32} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-widest text-xl mb-1">Verification Failed</h4>
                        <p className="font-bold text-rose-600/70">{error}</p>
                    </div>
                  </motion.div>
                )}

                {!result && !error && !loading && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-[2rem]">
                    <p className="text-slate-300 text-sm font-black uppercase tracking-widest">
                      Awaiting Input...
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="mt-12 text-center text-slate-400">
            <p className="text-xs font-bold uppercase tracking-[0.3em]">
              Serve & Lead Society • Trust & Transparency
            </p>
          </div>
        </div>
      </main>

      <div
        id="verify-cert-export"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none", zIndex: -1000 }}
      >
        <MembershipCertificateExact
          data={exportData || {}}
          certAssets={certAssets}
          id="verify-cert-inner"
        />
      </div>

      <Footer />
    </div>
  );
}
