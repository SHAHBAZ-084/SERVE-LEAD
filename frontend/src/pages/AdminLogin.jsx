import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AdminLogin() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (token) {
            navigate("/admin-portal", { replace: true });
        }
    }, [navigate]);

    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState(null);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post("admin/login", credentials);
            localStorage.setItem("adminUser", response.data.username);
            if (response.data.is_superuser) {
                localStorage.setItem("adminIsSuper", "1");
            } else {
                localStorage.removeItem("adminIsSuper");
            }
            navigate("/admin-portal", { replace: true });
        } catch (err) {
            console.error("Admin Login Error:", err);
            const msg = err.response?.data?.error || "Login Failed. Access Denied.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotMessage(null);
        try {
            const res = await api.post("auth/forgot-password", { email: forgotEmail });
            setForgotMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setForgotMessage({ type: 'error', text: err.response?.data?.error || "Reset failed. Invalid email." });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Tech/Secure Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_100%)] opacity-80" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 blur-[120px] rounded-full mix-blend-screen" />

                {/* Subtle Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}></div>
            </div>

            <main className="w-full max-w-[420px] relative z-10 animate-fade-up">

                {/* Header (White text on Dark BG) */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shadow-cyan-900/50 mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-400/20 group-hover:bg-cyan-400/30 transition-colors" />
                        <i className="fas fa-shield-halved text-4xl text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">
                        System Admin
                    </h1>
                    <p className="text-cyan-100 text-sm font-bold flex items-center justify-center gap-2 drop-shadow">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.9)]" /> Secure Area
                    </p>
                </div>

                {/* Login Form Card (High-Contrast White Area) */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(6,182,212,0.3)] border border-slate-200 relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-2xl mb-8 flex items-start gap-3 text-sm font-bold animate-shake shadow-sm">
                            <i className="fas fa-triangle-exclamation mt-0.5 text-rose-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Authorized Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                    <i className="fas fa-envelope text-sm" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-sm font-medium"
                                    placeholder=""
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                                    <i className="fas fa-lock text-sm" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 py-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-sm font-medium tracking-widest"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-cyan-600 transition-colors"
                                >
                                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:text-cyan-500 transition-colors"
                                >
                                    Reset Password?
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-600 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-cyan-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:transform-none relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    SECURE LOGIN <i className="fas fa-arrow-right" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/60 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <i className="fas fa-arrow-left" /> Back to Site
                    </button>
                </div>
            </main>

            {/* Admin Recovery Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(6,182,212,0.5)] border border-slate-200 overflow-hidden relative animate-zoom-in">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-emerald-500" />
                        <button 
                            onClick={() => { setShowForgotModal(false); setForgotMessage(null); }}
                            className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                            <i className="fas fa-times text-xl" />
                        </button>

                        <div className="p-12">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-8 shadow-inner group relative overflow-hidden">
                                <div className="absolute inset-0 bg-cyan-500/5" />
                                <i className="fas fa-shield-keyhole text-3xl text-cyan-600" />
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Reset Password</h2>
                            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">Enter your registered email to reset your password.</p>

                            {forgotMessage && (
                                <div className={`mb-8 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 border ${
                                    forgotMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                    <i className={forgotMessage.type === 'success' ? "fas fa-circle-check" : "fas fa-triangle-exclamation text-rose-500"} />
                                    <span>{forgotMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleForgotPassword} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Authorized Gmail</label>
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm font-medium"
                                        placeholder=""
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-600 transition-all shadow-2xl shadow-cyan-900/20 flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    {forgotLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Send reset link <i className="fas fa-paper-plane text-[10px]" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
