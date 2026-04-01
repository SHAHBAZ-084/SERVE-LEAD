import React from 'react';

const pillars = [
    {
        title: 'Leadership',
        desc: 'Developing confident, capable individuals through real-world society roles and team-building programs.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M2 20h20 M6 20V8l6-4 6 4v12 M12 4v16 M6 12h12" fill="currentColor" className="opacity-20"/>
                <path d="M2 20h20 M6 20V8l6-4 6 4v12 M12 4v16 M6 12h12" />
            </svg>
        ),
        color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
        title: 'Career Growth',
        desc: 'Bridging the gap between academia and industry with elite internship opportunities and skill-building sessions.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                 <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" className="opacity-20"/>
                 <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
        title: 'Social Welfare',
        desc: 'Promoting social responsibility through educational support and welfare initiatives for deserving students.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" fill="currentColor" className="opacity-20"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
        ),
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    }
];

export default function OurMission() {
    return (
        <section id="about" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16 animate-fade-up">
                    <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">Our Core DNA</span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                        Empowering students to <span className="gradient-text">Lead & Serve</span>
                    </h2>
                    <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                        We aim to build a strong community where financial challenges never become a barrier to excellence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((pillar, idx) => (
                        <div key={idx} className="bg-white p-10 md:p-12 flex flex-col items-center text-center card-hover group transition-all duration-500 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100">
                            <div className={`w-16 h-16 ${pillar.color} rounded-2xl flex items-center justify-center mb-8 border group-hover:scale-110 transition-all duration-500 shadow-xl`}>
                                {pillar.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4">{pillar.title}</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm md:text-base">
                                {pillar.desc}
                            </p>
                            <div className="mt-8 pt-6 border-t border-slate-50 w-full group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:gap-3 transition-all">
                                    Learn More <i className="fas fa-arrow-right" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Background decorative element */}
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl -z-10" />
        </section>
    );
}
