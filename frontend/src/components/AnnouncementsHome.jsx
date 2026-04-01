import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AnnouncementsHome() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/announcements')
            .then(res => {
                // Show latest 3 announcements
                setAnnouncements(res.data.slice(0, 3));
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching home announcements:', err);
                setLoading(false);
            });
    }, []);

    if (!loading && announcements.length === 0) return null;

    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16 animate-fade-up">
                    <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">Society Pulse</span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                        Latest <span className="gradient-text">Announcements</span>
                    </h2>
                    <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                        Stay up to date with the latest society news, urgent notices, and exciting updates.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : (
                        announcements.map((ann, idx) => (
                            <div key={idx} className="glass p-10 rounded-[2.5rem] border border-slate-200/50 card-hover group relative overflow-hidden animate-fade-up shadow-xl" style={{ animationDelay: `${idx * 150}ms` }}>
                                {/* Urgency Badge Overlay */}
                                <div className="absolute top-0 right-0 p-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${ann.type === 'Urgent' ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-cyan-100 text-cyan-700 shadow-cyan-100'}`}>
                                        {ann.type || 'Notice'}
                                    </span>
                                </div>

                                <div className="mb-6 flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    <i className="fas fa-calendar-day text-slate-300" />
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-cyan-600 transition-colors">
                                    {ann.title}
                                </h3>

                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-4 mb-8">
                                    {ann.content}
                                </p>

                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Official SLS Notice</span>
                                    <i className="fas fa-arrow-right text-slate-200 group-hover:text-cyan-500 group-hover:translate-x-2 transition-all" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
