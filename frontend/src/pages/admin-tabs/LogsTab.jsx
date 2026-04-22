import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const LogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const { notify } = useNotification();
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchLogs = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            const r = await api.get(`admin/logs?page=${currentPage}&limit=20`, auth);
            setLogs(r.data.logs || []);
            setTotalPages(r.data.totalPages || 1);
            setPage(r.data.currentPage || 1);
        } catch (err) {
            notify("Failed to load system logs", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        fetchLogs(page);
    }, [page, fetchLogs]);

    return (
        <div className="space-y-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h2>
            {loading ? <Spinner /> : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Admin</th>
                                    <th className="p-4">Target</th>
                                    <th className="p-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{log.action}</td>
                                        <td className="p-4 text-xs font-bold text-[#002147] uppercase">{log.admin_id}</td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold">{log.target_id?.name || "N/A"}</div>
                                            <div className="text-[10px] text-slate-400">{log.target_id?.email || log.details || "System"}</div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 flex justify-between border-t border-slate-100">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30">Prev</button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30">Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogsTab;
