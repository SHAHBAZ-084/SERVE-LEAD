import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match" });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await api.post("auth/reset-password", { token, newPassword: password });
            setMessage({ type: 'success', text: "Password reset successful! Redirecting to login..." });
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || "Reset failed. Link may be expired." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-geist">
            <div className="w-full max-w-md animate-fade-up">
                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#002147] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/20">
                        <i className="fas fa-key text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Security Update</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Establish New Credentials</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#002147]" />

                    {message && (
                        <div className={`mb-8 p-4 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 animate-fade-in ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                            <i className={message.type === 'success' ? "fas fa-check-circle" : "fas fa-triangle-exclamation"} />
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 text-left">New Security Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#002147]/5 focus:border-[#002147] outline-none transition-all placeholder:text-slate-300 font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 text-left">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#002147]/5 focus:border-[#002147] outline-none transition-all placeholder:text-slate-300 font-medium"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#002147] text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-shield-check" />}
                            Update Password
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Serve & Lead Society (SLS) Security Protocol
                </p>
            </div>
        </div>
    );
}
