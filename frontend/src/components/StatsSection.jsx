import { useEffect, useRef, useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const stats = [
  { icon: "fa-user-graduate", title: "Success Internees", value: "50+", color: "cyan" },
  { icon: "fa-users-gear", title: "Executive Members", value: "3", color: "amber" },
  { icon: "fa-briefcase", title: "Members", value: "200+", color: "green" },
  { icon: "fa-bullseye", title: "Job Success", value: "10+", color: "purple" },
];

const colorMap = {
  cyan: { bg: "bg-cyan-100", icon: "text-cyan-500", value: "text-cyan-600", ring: "group-hover:ring-cyan-300" },
  amber: { bg: "bg-amber-100", icon: "text-amber-500", value: "text-amber-600", ring: "group-hover:ring-amber-300" },
  green: { bg: "bg-green-100", icon: "text-green-500", value: "text-green-600", ring: "group-hover:ring-green-300" },
  purple: { bg: "bg-purple-100", icon: "text-purple-500", value: "text-purple-600", ring: "group-hover:ring-purple-300" },
};

/** Single counter that animates 0 → target when `start` becomes true */
function AnimatedNumber({ value, start }) {
  const numericPart = parseInt(value, 10) || 0;
  const suffix = String(value).replace(/^\d+/, ""); // e.g. "+"
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!start || numericPart === 0) { setDisplay(0); return; }
    const duration = 1500; // ms
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplay(Math.floor(ease * numericPart));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(numericPart);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [start, numericPart]);

  return <>{start ? `${display}${suffix}` : `0${suffix}`}</>;
}

export default function StatsSection({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const ref = useScrollReveal();
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={(el) => { sectionRef.current = el; if (ref && typeof ref === "object") ref.current = el; }} 
      className={`${isDark ? 'bg-slate-950 border-y border-white/5 py-24' : 'bg-white py-16'} overflow-hidden relative`}
    >
      <div className={`max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-6 relative z-10`}>
        {stats.map((stat, idx) => {
          const c = colorMap[stat.color];
          return (
            <div
              key={idx}
              className={`reveal group flex flex-col items-center text-center delay-${(idx + 1) * 100}`}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl md:rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : `${c.bg} shadow-md`} flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg`}>
                <i className={`fas ${stat.icon} text-2xl md:text-3xl ${isDark ? 'text-cyan-400' : c.icon}`} />
              </div>
              <p className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : c.value} mt-1 tabular-nums tracking-tight`}>
                <AnimatedNumber value={stat.value} start={visible} />
              </p>
              <h4 className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.title}</h4>
            </div>
          );
        })}
      </div>

      {isDark && (
        <>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 blur-[100px] rounded-full -z-0" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/10 blur-[100px] rounded-full -z-0" />
        </>
      )}
    </section>
  );
}
