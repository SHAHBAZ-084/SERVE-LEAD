import { useNavigate } from "react-router-dom";

export default function VerificationHomeSection() {
    const navigate = useNavigate();

    return (
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

            <div className="max-w-4xl mx-auto px-6 text-center animate-fade-up">
                <div className="mb-10 flex justify-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl border border-white/20 shadow-2xl animate-float">
                        <i className="fas fa-shield-check text-cyan-400" />
                    </div>
                </div>

                <span className="text-cyan-400 font-black tracking-widest uppercase text-xs mb-4 block">Trust & Verification</span>
                <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                    Official Member <span className="text-white">Verification Hub</span>
                </h2>
                <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                    Ensuring transparency and authenticity. Use our centralized portal to instantly verify any society membership or verified certificate issued by SLS.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button
                        onClick={() => navigate("/verification")}
                        className="w-full sm:w-auto bg-cyan-500 text-white px-12 py-4.5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-cyan-600 hover:scale-105 transition-all duration-300 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3"
                    >
                        <i className="fas fa-search" /> Verify Now
                    </button>
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Digital Auth Enabled</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
