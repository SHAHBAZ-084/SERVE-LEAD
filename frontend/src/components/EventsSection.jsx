import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import defaultImg from '../assets/welcome.jpg';
import CountdownTimer from './common/CountdownTimer';

const API_BASE_URL = 'https://api.serveandlead.org';
const getImgUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const base = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
};

export default function EventsSection() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        api.get('/events/')
            .then((response) => {
                setEvents(response.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('EventsSection fetch error', err);
                setLoading(false);
            });
    }, []);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section id="events" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="animate-fade-up">
                        <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">Society Life</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                            Latest <span className="gradient-text">Events & Highlights</span>
                        </h2>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => scroll('left')}
                            className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:shadow-xl transition-all duration-300"
                        >
                            <i className="fas fa-arrow-left" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:shadow-xl transition-all duration-300"
                        >
                            <i className="fas fa-arrow-right" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex gap-8 overflow-hidden py-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="min-w-[340px] h-[440px] bg-slate-50 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <i className="fas fa-calendar-alt text-slate-200 text-6xl mb-4" />
                        <p className="text-slate-500 font-medium">No active events posters right now. Check back soon!</p>
                    </div>
                ) : (
                    <div
                        ref={scrollRef}
                        className="flex gap-8 overflow-x-auto pb-12 px-2 snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {events.map((event, idx) => {
                            const d = event.endDate || event.date;
                            const dateStr = d ? new Date(d).toISOString().split('T')[0] : "";
                            const targetDate = `${dateStr}T${event.time || "23:59"}:00`;

                            return (
                                <div
                                    key={event._id}
                                    className="w-[320px] md:w-[380px] shrink-0 snap-center group animate-fade-up"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="glass rounded-[2.5rem] overflow-hidden border border-slate-200/50 card-hover h-full flex flex-col shadow-xl">
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={getImgUrl(event.image_url) || defaultImg}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-6 left-6 glass px-4 py-2 rounded-2xl shadow-lg border border-white/50">
                                                <p className="text-xs font-black text-slate-900">
                                                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col min-w-0">
                                            <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-cyan-600 transition-colors break-words">
                                                {event.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed break-words">
                                                {event.description}
                                            </p>
                                            <div className="mt-auto space-y-6">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Time Remaining</span>
                                                    <div className="bg-slate-50/50 rounded-3xl px-6 py-4 border border-slate-100/50 inline-block w-full">
                                                        <CountdownTimer targetDate={targetDate} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-6">
                                                    <span className="flex items-center gap-2 max-w-[50%] truncate" title={event.location}><i className="fas fa-map-marker-alt text-cyan-500" /> {event.location || "TBA"}</span>
                                                    <span className="flex items-center gap-2"><i className="fas fa-clock text-cyan-500" /> {event.time || "TBA"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="absolute top-0 right-0 w-24 h-full bg-linear-to-l from-white to-transparent pointer-events-none z-10 hidden md:block" />
            <div className="absolute top-0 left-0 w-24 h-full bg-linear-to-r from-white to-transparent pointer-events-none z-10 hidden md:block" />
        </section>
    );
}