import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:border-[#002147]/20">
        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out`} />
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                <h3 className={`text-4xl font-black text-${color}-600 tracking-tighter`}>{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-500 shadow-inner group-hover:-translate-y-1 transition-transform`}>
                <i className={`fas ${icon} text-xl`} />
            </div>
        </div>
    </div>
);

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const DashboardTab = ({ adminUser, setActiveTab, isSuper, tabs }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { notify } = useNotification();
    const token = localStorage.getItem("adminToken");
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get("admin/dashboard", auth);
            setStats(r.data);
        } catch (err) {
            notify(err.response?.data?.error || "Failed to load dashboard stats", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]); // Removed auth dependency to prevent infinite loops

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="relative p-8 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#002147]/5 blur-[100px] -mr-32 -mt-32" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">Welcome back, <span className="text-[#002147]">{adminUser}</span> 👋</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium">SLS Society Management Dashboard</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setActiveTab('events')} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-indigo-100 flex items-center gap-2">
                            <i className="fas fa-calendar-plus" /> Create Event
                        </button>
                        <button onClick={() => setActiveTab('certificates')} className="px-5 py-2.5 bg-[#002147] hover:bg-slate-800 text-white shadow-lg shadow-blue-900/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                            <i className="fas fa-certificate" /> Create Certificate
                        </button>
                    </div>
                </div>
            </div>
            {loading || !stats ? (
                <Spinner />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard icon="fa-users" label="Total Members" value={stats.total_members} color="blue" />
                    <StatCard icon="fa-user-clock" label="Pending" value={stats.pending_members} color="indigo" />
                    {isSuper && <StatCard icon="fa-user-shield" label="Admins" value={stats.total_admins} color="sky" />}
                    <StatCard icon="fa-calendar-alt" label="Events" value={stats.total_events} color="violet" />
                </div>
            )}

            <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Quick Management</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tabs.slice(1, 4).map((t) => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#002147] hover:shadow-lg transition-all duration-300 group">
                            <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-[#002147] transition-colors">
                                <i className={`fas ${t.icon} text-[#002147] text-sm group-hover:text-white`} />
                            </div>
                            <span className="text-slate-600 group-hover:text-[#002147] text-sm font-bold tracking-tight transition-colors">{t.label}</span>
                            <i className="fas fa-chevron-right text-slate-300 text-xs ml-auto group-hover:text-[#002147] group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
