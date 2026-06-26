import bg from "../assets/bg1.jpeg";
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";

export default function HeroSection() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);
    const [user, setUser] = useState({ token: null, name: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        const status = localStorage.getItem("status");
        
        if (token && status === "approved") {
            setUser({ token, name });
        } else {
            setUser({ token: null, name: "" });
        }

        const timer = setTimeout(() => setLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section
            className="relative min-h-screen flex flex-col items-center justify-center text-center bg-cover bg-center bg-no-repeat overflow-hidden"
            style={{ backgroundImage: `url(${bg})` }}
        >
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

            {/* Floating decorative circles */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-float" />
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-cyan-300/10 rounded-full blur-3xl animate-float delay-400" />
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-amber-300/10 rounded-full blur-xl animate-float delay-200" />

            {/* Hero Content */}
            <div className="relative z-10 px-6 max-w-4xl w-full">
                <div className="glass p-10 md:p-16 flex flex-col items-center animate-fade-up">
                {user.token ? (
                    <div className="flex flex-col items-center">
                        {/* Premium Profile Icon */}
                        <div className="mb-8 relative group">
                            <div className="w-28 h-28 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl flex items-center justify-center text-4xl font-black text-slate-800 shadow-2xl shadow-cyan-900/10 group-hover:scale-105 transition-all duration-500">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white border-2 border-white animate-pulse">
                                <i className="fas fa-check text-[10px]" />
                            </div>
                        </div>

                        <p className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3">Society Member Active</p>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
                            Welcome back, <span className="gradient-text">{user.name}</span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-10 max-w-2xl">
                            Your leadership journey continues. Access your certificates and club events from your dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-pulse bg-slate-900 text-white px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-cyan-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.6)] transition-all duration-500 shadow-xl shadow-slate-900/20 flex items-center gap-3 group"
                            >
                                <i className="fas fa-th-large group-hover:rotate-12 transition-transform duration-300" /> Enter Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/events')}
                                className="bg-white/60 backdrop-blur-sm border-2 border-slate-900 text-slate-900 px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] transition-all duration-500"
                            >
                                Events Hub
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className={`px-5 py-2 rounded-full bg-cyan-50 border border-cyan-200/60 text-cyan-700 text-xs font-black tracking-widest uppercase mb-8 shadow-sm transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                            <i className="fas fa-crown text-amber-500 mr-2" /> Serve &amp; Lead Society
                        </span>
                        
                        <h1 className={`text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-[1.1] transition-all duration-700 delay-100 tracking-tighter ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                            Building leaders through <span className="gradient-text italic">service</span>
                        </h1>
                        
                        <p className={`text-base md:text-xl text-slate-600 mb-10 font-medium transition-all duration-700 delay-200 max-w-2xl leading-relaxed ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                            Empowering students through professional internships, societal welfare, and profound personal growth.
                        </p>
                        
                        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 w-full md:w-auto ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto btn-pulse bg-slate-900 text-white px-10 py-5 rounded-3xl text-xs font-black tracking-widest uppercase hover:bg-cyan-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-slate-900/20"
                            >
                                Get Membership
                            </button>
                            <button
                                onClick={() => navigate('/executive-register')}
                                className="w-full sm:w-auto bg-amber-500 text-white px-10 py-5 rounded-3xl text-xs font-black tracking-widest uppercase hover:bg-amber-600 hover:-translate-y-1.5 transition-all duration-500 shadow-2xl shadow-amber-900/20 flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-crown text-[10px]" /> Executive Member
                            </button>
                            <button
                                onClick={() => navigate('/about')}
                                className="w-full sm:w-auto border-2 border-slate-900 text-slate-900 px-10 py-5 rounded-3xl text-xs font-black tracking-widest uppercase hover:bg-slate-900 hover:text-white hover:-translate-y-1.5 transition-all duration-500 bg-white/5 backdrop-blur-sm"
                            >
                                Read More
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-70">
                <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
                    <div className="w-1.5 h-3 bg-gray-600 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}
