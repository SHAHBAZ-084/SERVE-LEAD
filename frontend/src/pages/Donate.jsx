import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api'
import footerImg from "../assets/abc.png"

const Donate = () => {
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        api.get('settings').then(res => {
            if (res.data.donation_channels) {
                try {
                    const parsed = JSON.parse(res.data.donation_channels);
                    setChannels(parsed);
                } catch { setChannels([]); }
            }
        }).catch(err => console.error("Error fetching settings:", err));
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            <Navbar />
            
            <main className="flex-1 flex flex-col items-center justify-center py-16 px-6 relative overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-400/20 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -z-10" />

                {/* Main Card */}
                <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col relative animate-fade-up">
                    
                    {/* Top: Full width image */}
                    <div className="w-full relative overflow-hidden group rounded-t-[2.5rem] bg-slate-100 flex items-center justify-center">
                        <img 
                            src={footerImg} 
                            alt="Nation Building" 
                            className="w-full h-auto block" 
                        />
                    </div>

                    {/* Bottom: Emotional Content & Details side by side on large screens */}
                    <div className="w-full p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 relative z-10 bg-white items-center">
                        
                        {/* Left/Top: Emotional Text */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-center">
                            <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-4 flex items-center gap-2">
                                <i className="fas fa-heart" /> Join Our Mission
                            </span>
                            
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                                We want to build a better <span className="gradient-text italic">Nation</span>
                            </h1>
                            
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                                Your support is the foundation of tomorrow's leaders. Every contribution helps us empower individuals 
                                and construct a stronger, brighter future for our country. With your support, we can make it happen.
                            </p>
                        </div>

                        {/* Right/Bottom: Donation Channels (Glass-dark effect) */}
                        <div className="w-full lg:w-1/2">
                            <div className="glass-dark p-8 md:p-10 rounded-3xl text-white shadow-2xl border border-slate-700/50 relative overflow-hidden group min-h-[400px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-all duration-700" />
                                
                                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-8 flex items-center gap-2">
                                    <i className="fas fa-shield-check" /> Secure Donation Channels
                                </h3>
                                
                                <div className="flex flex-col gap-6 relative z-10">
                                    {channels.length === 0 ? (
                                        <div className="text-center py-10 opacity-30">
                                            <i className="fas fa-hourglass-start text-4xl mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Admin Configuration</p>
                                        </div>
                                    ) : (
                                        channels.map((ch) => (
                                            <div key={ch.id} className="flex flex-col gap-3 p-5 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group/btn">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/btn:scale-110 ${ch.type === 'Bank' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                                        <i className={`fas ${ch.type === 'Bank' ? 'fa-building-columns' : 'fa-mobile-screen'} text-xl text-white`}></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{ch.type === 'Bank' ? ch.bankName : `${ch.walletType} Account`}</p>
                                                        <p className="text-xl font-black text-white tracking-tight">
                                                            {ch.type === 'Wallet' ? ch.number : ch.accountNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                {ch.type === 'Bank' && (
                                                    <div className="mt-2 pt-3 border-t border-white/5">
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                            <i className="fas fa-globe text-cyan-500" /> Official IBAN Number
                                                        </p>
                                                        <p className="text-sm font-mono text-cyan-400 font-bold break-all bg-black/20 p-3 rounded-xl border border-white/5">
                                                            {ch.iban}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Donate
