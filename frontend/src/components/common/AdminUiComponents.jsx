import { useState, useEffect, useRef } from "react";

// ── Shared Primitives ─────────────────────────────────────
export const inputCls =
    "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#002147]/10 focus:border-[#002147] focus:outline-none transition-all duration-200 text-sm shadow-sm";

/** Counts up from 0 → target with easeOutQuart easing */
export function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        const end = Number(target);
        if (!end) { setCount(0); return; }
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4); // easeOutQuart
            setCount(Math.floor(ease * end));
            if (p < 1) raf.current = requestAnimationFrame(tick);
            else setCount(end);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return count;
}

export const StatCard = ({ icon, label, value, color }) => {
    const p = {
        blue: { bg: "from-[#002147] to-[#003366]", shadow: "shadow-blue-900/20", glow: "bg-blue-400" },
        indigo: { bg: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-900/20", glow: "bg-indigo-300" },
        sky: { bg: "from-sky-500 to-blue-600", shadow: "shadow-sky-900/20", glow: "bg-sky-300" },
        violet: { bg: "from-violet-600 to-purple-800", shadow: "shadow-violet-900/20", glow: "bg-violet-300" },
        rose: { bg: "from-rose-500 to-pink-700", shadow: "shadow-rose-900/20", glow: "bg-rose-300" },
        emerald: { bg: "from-emerald-500 to-teal-700", shadow: "shadow-emerald-900/20", glow: "bg-emerald-300" },
    };
    const c = p[color] || p.blue;
    const rawStr = String(value ?? "0");
    const numeric = parseInt(rawStr, 10) || 0;
    const suffix = rawStr.replace(/^\d+/, "");
    const animated = useCountUp(numeric);
    
    return (
        <div className={`relative bg-gradient-to-br ${c.bg} rounded-[2rem] p-6 text-white shadow-2xl ${c.shadow} overflow-hidden group hover:-translate-y-2 transition-all duration-500`}>
            {/* Live Pulse Glow */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${c.glow} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-700`} />
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-110 transition-transform duration-500">
                        <i className={`fas ${icon} text-xl animate-float`} />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Live</span>
                    </div>
                </div>
                
                <p className="text-4xl font-black tabular-nums leading-none tracking-tight mb-2">
                    {value == null ? "—" : `${animated}${suffix}`}
                </p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">{label}</p>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export const Spinner = () => (
    <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" style={{ borderWidth: "3px" }} />
    </div>
);
