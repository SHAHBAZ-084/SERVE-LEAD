import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="bg-slate-950 pt-20 pb-10 text-white relative overflow-hidden border-t border-white/5">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
                    {/* Brand Section */}
                    <div className="space-y-6 flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <i className="fas fa-crown text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Serve & <span className="text-cyan-400">Lead Society</span></h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xs">
                            Building a strong community of motivated individuals who learn, serve, and lead for a better future.
                        </p>
                    </div>

                    {/* Quick Nav */}
                    <div className="space-y-6 flex flex-col items-center md:items-start">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Explore</h3>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => navigate('/about')} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> About
                            </button>
                            <button onClick={() => { navigate('/'); setTimeout(() => { document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> Events
                            </button>
                            <button onClick={() => navigate('/donate')} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> Donate
                            </button>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-6 flex flex-col items-center md:items-start">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Portal</h3>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> Member Login
                            </button>
                            <button onClick={() => navigate('/register')} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> Register Now
                            </button>
                            <button onClick={() => navigate('/admin-login')} className="text-slate-400 hover:text-cyan-400 text-sm font-bold transition-colors flex items-center gap-2 group justify-center md:justify-start">
                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-cyan-500 transition-colors" /> Admin Panel
                            </button>
                        </div>
                    </div>

                    {/* Connect */}
                    <div className="space-y-6 flex flex-col items-center md:items-start">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Contact Info</h3>
                        <div className="space-y-4 text-sm font-bold text-slate-400">
                            <p className="flex items-center gap-3 justify-center md:justify-start"><i className="fas fa-envelope text-cyan-500" /> serveandleadsociety@gmail.com</p>
                            <p className="flex items-center gap-3 justify-center md:justify-start"><i className="fas fa-location-dot text-cyan-500" /> Ghoray Shah Road Near UET Lahore</p>
                            <p className="flex items-center gap-3 justify-center md:justify-start"><i className="fas fa-phone text-cyan-500" /> 0314-1683402</p>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="flex flex-col">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            © 2025 Serve & Lead Society. All rights reserved.
                        </p>
                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.4em] mt-3 flex items-center justify-center md:justify-start gap-3 opacity-60 hover:opacity-100 transition-all duration-700">
                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                            System Developed by <span className="text-white font-black tracking-[0.2em]">Shahbaz & Ali</span>
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <a href="https://www.facebook.com/share/15vTx4Y1r6/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all shadow-xl">
                            <i className="fab fa-facebook-f" />
                        </a>
                        <a href="https://www.instagram.com/serveandleadsociety?igsh=N3pzZDYzcTM4amJq&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all shadow-xl">
                            <i className="fab fa-instagram" />
                        </a>
                        <a href="https://www.linkedin.com/company/serve-lead-society/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all shadow-xl">
                            <i className="fab fa-linkedin-in" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
