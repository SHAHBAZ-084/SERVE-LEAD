import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImgUrl } from '../api';

export default function BoardOfExecutivePage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('settings').then(r => {
            if (r.data.board_of_executive) {
                try { setMembers(JSON.parse(r.data.board_of_executive)); } catch { setMembers([]); }
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-white/5 py-20 text-center">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
                >
                    <i className="fas fa-arrow-left" /> Back
                </button>

                {/* Decorative top line */}
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-6" />

                <p className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">
                    Serve &amp; Lead Society
                </p>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Board of Executive
                </h1>
                <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
                    Meet the dedicated leaders who drive our mission of building leaders through service.
                </p>

                <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-6" />
            </div>

            {/* Members Grid */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                {loading ? (
                    <div className="text-center py-24 text-slate-500">
                        <i className="fas fa-spinner fa-spin text-2xl" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-24 text-slate-600">
                        <i className="fas fa-users text-4xl mb-4 block opacity-30" />
                        <p className="text-slate-500">Board information coming soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/30 rounded-3xl p-8 transition-all duration-300 flex flex-col items-center text-center"
                            >
                                {/* Glow on hover */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-cyan-500/0 group-hover:from-cyan-500/5 to-transparent transition-all duration-300 pointer-events-none" />

                                {/* Photo */}
                                <div className="relative mb-6">
                                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-cyan-500/40 transition-all duration-300 shadow-xl">
                                        {member.img ? (
                                            <img
                                                src={getImgUrl(member.img)}
                                                alt={member.name}
                                                className="w-full h-full object-cover object-top"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-slate-800 flex items-center justify-center text-3xl font-black text-cyan-400">
                                                {member.name?.charAt(0)?.toUpperCase() || 'E'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Accent ring */}
                                    <div className="absolute -inset-1 rounded-full border border-cyan-500/0 group-hover:border-cyan-500/20 transition-all duration-300" />
                                </div>

                                {/* Name */}
                                <h3 className="text-white font-bold text-lg leading-tight mb-1">
                                    {member.name}
                                </h3>

                                {/* Role badge */}
                                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide mb-4">
                                    {member.role}
                                </span>

                                {/* Description */}
                                {member.description && (
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {member.description}
                                    </p>
                                )}

                                {/* Details */}
                                {member.details && (
                                    <p className="text-slate-500 text-xs leading-relaxed mb-5 border-t border-white/5 pt-4 w-full">
                                        {member.details}
                                    </p>
                                )}

                                {/* Links */}
                                <div className="flex items-center gap-3 mt-auto pt-2">
                                    {member.email && (
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-cyan-500/20 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-all"
                                            title={member.email}
                                        >
                                            <i className="fas fa-envelope text-xs" />
                                        </a>
                                    )}
                                    {member.linkedin && (
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-cyan-500/20 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-all"
                                        >
                                            <i className="fab fa-linkedin-in text-xs" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
