import { useState } from "react";
import { X, ShieldCheck, Search, Loader2, AlertCircle } from "lucide-react";
import api, { getImgUrl } from "../../api";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationModal({ isOpen, onClose }) {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!memberId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Auto-fix format: replace dots/spaces with dashes
      const cleanId = memberId.trim().replace(/[\s.]/g, "-").toUpperCase();
      const response = await api.get(`auth/verify/${cleanId}`);
      setResult(response.data.member);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="text-cyan-400 w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-widest">Verify Membership</h3>
              </div>
              <p className="text-slate-400 text-sm">Enter an SLS ID to verify official status.</p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">
                  Membership ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. 2026-SLS-0001"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:border-cyan-500 focus:bg-white outline-none transition-all pr-12 font-bold tracking-wider"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors">
                    <Search size={20} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !memberId.trim()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Verifying...
                  </>
                ) : (
                  "Verify Member"
                )}
              </button>
            </form>

            {/* Results Area */}
            <div className="mt-8 min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-5"
                  >
                    <div className="relative">
                      <img
                        src={getImgUrl(result.profile_pic_url) || "https://ui-avatars.com/api/?name=" + result.name}
                        alt={result.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white">
                        <ShieldCheck size={12} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-emerald-900 font-black text-lg leading-tight uppercase tracking-tight">
                        {result.name}
                      </h4>
                      <p className="text-emerald-700 text-xs font-bold mt-0.5">
                        OFFICIAL {result.role === 'General' ? 'MEMBER' : result.role.toUpperCase()}
                      </p>
                      <p className="text-emerald-600/60 text-[10px] mt-1 font-medium">
                        Since {result.joining_year}
                      </p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center gap-4 text-rose-800"
                  >
                    <AlertCircle className="shrink-0 text-rose-500" size={24} />
                    <p className="text-sm font-bold">{error}</p>
                  </motion.div>
                )}

                {!result && !error && !loading && (
                  <p className="text-slate-300 text-sm font-medium italic">
                    Enter an ID above to start verification
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              © Serve & Lead Society • Official Verification System
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
