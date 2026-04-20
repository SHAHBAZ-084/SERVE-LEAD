import React, { useState } from 'react';
import api from '../api';

export default function ContactUsSection() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await api.post('/contact', form);
            setStatus({ type: 'success', text: 'Message delivered successfully! We will contact you soon.' });
            setForm({ name: '', email: '', message: '' });
        } catch (err) {
            setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to dispatch message.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="py-20 md:py-24 bg-white relative">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-slate-50 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white/60 animate-fade-up">
                    <div className="text-center mb-10 md:mb-12">
                        <span className="text-cyan-600 font-black tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Connect With Us</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
                            Have questions? <span className="gradient-text">Let's Talk</span>
                        </h2>
                        <p className="text-slate-500 mt-4 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                            Our team is always ready to support your leadership and career goals.
                        </p>
                    </div>

                    {status && (
                        <div className={`mb-8 p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest animate-fade-in ${
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                            {status.type === 'success' ? <i className="fas fa-check-circle mr-2" /> : <i className="fas fa-exclamation-triangle mr-2" />}
                            {status.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 md:py-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm text-sm"
                                    placeholder="Farooq Baloch"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 md:py-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm text-sm"
                                    placeholder="farooq@slsuet.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                            <textarea
                                rows={4}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-[2rem] px-6 py-4 md:py-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm resize-none text-sm"
                                placeholder="How can we help you today?"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs md:text-sm tracking-widest hover:bg-cyan-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl shadow-cyan-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><i className="fas fa-paper-plane" /> Send Message</>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-200/60 text-center flex flex-col items-center">
                        <p className="text-[11px] font-black text-[#5e6d8a] uppercase tracking-[0.2em] mb-6">Or join us directly</p>
                        <a 
                            href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-4 px-10 py-5 bg-[#25D366] text-white rounded-full font-black uppercase text-xs md:text-sm tracking-widest hover:bg-[#20ba59] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 shadow-[0_15px_30px_-5px_rgba(37,211,102,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(37,211,102,0.4)]"
                        >
                            <i className="fab fa-whatsapp text-xl md:text-2xl" />
                            <span>Join WhatsApp Community</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Background decorative flair */}
            <div className="absolute bottom-0 right-0 w-1/3 h-64 bg-cyan-100/30 blur-[100px] -z-10 rounded-full" />
        </section>
    );
}
