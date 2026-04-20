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
        blue: { bg: "from-[#002147] to-[#003366]", shadow: "shadow-blue-900/10" },
        indigo: { bg: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-900/10" },
        sky: { bg: "from-blue-500 to-blue-700", shadow: "shadow-blue-900/10" },
        violet: { bg: "from-slate-800 to-slate-900", shadow: "shadow-slate-900/10" },
    };
    const c = p[color] || p.blue;
    const rawStr = String(value ?? "0");
    const numeric = parseInt(rawStr, 10) || 0;
    const suffix = rawStr.replace(/^\d+/, ""); // keeps "+" if present
    const animated = useCountUp(numeric);
    return (
        <div className={`relative bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg ${c.shadow} overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute right-2 bottom-2 w-12 h-12 rounded-full bg-white/5" />
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <i className={`fas ${icon} text-lg`} />
            </div>
            <p className="text-3xl font-extrabold tabular-nums">
                {value == null ? "—" : `${animated}${suffix}`}
            </p>
            <p className="text-white/75 text-xs font-medium mt-0.5 uppercase tracking-wide">{label}</p>
        </div>
    );
};

export const Spinner = () => (
    <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" style={{ borderWidth: "3px" }} />
    </div>
);
