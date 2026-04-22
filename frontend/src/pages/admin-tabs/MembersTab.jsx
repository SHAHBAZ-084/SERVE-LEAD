import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const MembersTab = ({ adminUser }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);

    const debouncedSearch = useDebounce(search, 500);
    const { notify, confirm } = useNotification();
    
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchMembers = useCallback(async (currentPage = 1, searchQuery = "") => {
        setLoading(true);
        try {
            const r = await api.get(`admin/members?page=${currentPage}&limit=10&search=${searchQuery}`, auth);
            setMembers(r.data.members || []);
            setTotalPages(r.data.totalPages || 1);
            setPage(r.data.currentPage || 1);
        } catch (err) {
            notify("Failed to fetch members", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    // Fetch when page or debounced search changes
    useEffect(() => {
        fetchMembers(page, debouncedSearch);
    }, [page, debouncedSearch, fetchMembers]);

    // Reset page to 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? members.map(m => m._id) : []);
    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const deleteSingle = async (dbId, name) => {
        const confirmed = await confirm({
            title: 'Delete Member',
            message: `Are you sure you want to PERMANENTLY DELETE ${name}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Permanently'
        });
        
        if (!confirmed) return;

        setIsProcessing(true);
        try {
            await api.delete(`admin/members/${dbId}`, auth);
            notify("Member deleted successfully.");
            fetchMembers(page, debouncedSearch);
        } catch (err) {
            notify(err.response?.data?.error || "Delete failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSuspend = async (memberDbId) => {
        try {
            const res = await api.patch(`admin/members/${memberDbId}/toggle-block`, {}, auth);
            fetchMembers(page, debouncedSearch);
            notify(res.data.message);
        } catch (err) {
            notify(err.response?.data?.error || "Failed to update member status", "error");
        }
    };

    const handleBulkDelete = async () => {
        const confirmed = await confirm({
            title: 'Bulk Delete',
            message: `CRITICAL: Permanently delete ${selectedIds.length} members?`,
            type: 'danger',
            confirmText: 'Yes, Delete All'
        });

        if (!confirmed) return;

        setIsProcessing(true);
        try {
            await api.post("admin/members/bulk-delete", { ids: selectedIds }, auth);
            notify(`Successfully deleted ${selectedIds.length} members.`);
            fetchMembers(page, debouncedSearch);
            setSelectedIds([]);
            setBulkMode(false);
        } catch (err) {
            notify("Bulk delete failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-up relative">
            {selectedIds.length > 0 && (
                <div className="fixed sm:absolute bottom-6 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[100] bg-slate-900 text-white px-5 sm:px-6 py-3 rounded-2xl sm:rounded-full shadow-2xl shadow-blue-900/40 flex flex-wrap items-center justify-center gap-4 animate-fade-up border border-slate-700 w-[90%] sm:w-auto ring-4 ring-slate-900/20 backdrop-blur-md">
                    <span className="text-[10px] sm:text-xs font-bold bg-white/10 px-3 py-1 rounded-xl sm:rounded-full whitespace-nowrap">{selectedIds.length} Selected</span>
                    <div className="hidden sm:block w-px h-4 bg-white/20" />
                    <button onClick={handleBulkDelete} disabled={isProcessing} className="text-rose-400 hover:text-rose-300 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                        {isProcessing ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-alt" />} Delete
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Members</h2>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${bulkMode ? 'bg-[#002147] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        <i className="fas fa-layer-group mr-2" /> {bulkMode ? "Done" : "Select"}
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input type="text" placeholder="Search members..." value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#002147]/10 focus:border-[#002147] outline-none text-sm transition-all" />
                    </div>
                </div>
            </div>

            {loading ? <Spinner /> : (
                <>
                    <div className="sm:hidden space-y-2">
                        {members.length === 0 ? (
                            <div className="text-center py-20 text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                                <i className="fas fa-id-badge text-5xl mb-4 block opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No records matched</p>
                            </div>
                        ) : members.map((m) => (
                            <div key={m._id} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden transition-all">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#002147] text-white rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-md">
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 leading-none mb-1 text-xs">{m.name}</h4>
                                            <p className="text-[9px] font-bold text-[#002147]/60 uppercase tracking-widest">{m.member_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${m.status === 'blocked' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                            {m.status === 'blocked' ? "Suspended" : "Active"}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{m.role || "General"}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {m.role !== 'Superuser' && m.member_id !== adminUser && (
                                        <>
                                            <button onClick={() => toggleSuspend(m._id)}
                                                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all border ${m.status === 'blocked' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                                                {m.status === 'blocked' ? "Active" : "Suspend"}
                                            </button>
                                            <button onClick={() => deleteSingle(m._id, m.name)}
                                                className="flex-1 text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100 py-2 rounded-lg">
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {m.member_id === adminUser && (
                                        <div className="flex-1 text-center py-2 text-[9px] font-bold uppercase tracking-widest text-slate-300 italic bg-slate-50 rounded-lg">Primary Admin (Owner)</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                        {bulkMode && (<th className="px-6 py-4 w-10 text-center transition-all">
                                            <input type="checkbox" checked={selectedIds.length === members.length && members.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
                                        </th>)}
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Member ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Official Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Gmail / Email</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {members.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-20 text-slate-400">
                                            <i className="fas fa-id-badge text-5xl mb-4 block opacity-10" /> No records matched the query.
                                        </td></tr>
                                    ) : members.map((m) => (
                                        <tr key={m._id} className={`transition-colors group ${selectedIds.includes(m._id) ? 'bg-[#002147]/5' : 'hover:bg-slate-50'}`}>
                                            {bulkMode && (<td className="px-6 py-5 text-center transition-all">
                                                <input type="checkbox" checked={selectedIds.includes(m._id)} onChange={() => toggleSelect(m._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
                                            </td>)}
                                            <td className="px-6 py-5 font-mono text-xs text-[#002147] font-bold">{m.member_id}</td>
                                            <td className="px-6 py-5 text-slate-800 font-bold">{m.name}</td>
                                            <td className="px-6 py-5 text-slate-500 text-xs">{m.email}</td>
                                            <td className="px-6 py-5">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${m.role === 'Executive' ? "bg-purple-100 text-purple-700" :
                                                    m.role === 'Admin' ? "bg-amber-100 text-amber-800" :
                                                        m.role === 'Superuser' ? "bg-rose-100 text-rose-800" :
                                                            "bg-blue-50 text-blue-700"
                                                    }`}>
                                                    {m.role || "General"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${m.status === 'blocked' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                    {m.status === 'blocked' ? "Suspended" : "Active"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {m.role !== 'Superuser' && m.member_id !== adminUser && (
                                                        <>
                                                            <button onClick={() => toggleSuspend(m._id)}
                                                                title={m.status === 'blocked' ? "Reactivate Membership" : "Suspend Membership"}
                                                                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${m.status === 'blocked' ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50"}`}>
                                                                <i className={`fas ${m.status === 'blocked' ? "fa-user-check" : "fa-user-lock"} mr-1`} />
                                                                {m.status === 'blocked' ? "Reactivate" : "Suspend"}
                                                            </button>
                                                            <button onClick={() => deleteSingle(m._id, m.name)}
                                                                className="text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">
                                                                <i className="fas fa-trash-alt mr-1" /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                    {m.member_id === adminUser && (
                                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 opacity-50 px-3 py-1.5">Owner</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest disabled:opacity-50 hover:text-[#002147]"
                                >
                                    <i className="fas fa-chevron-left mr-2" /> Prev
                                </button>
                                <span className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</span>
                                <button 
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest disabled:opacity-50 hover:text-[#002147]"
                                >
                                    Next <i className="fas fa-chevron-right ml-2" />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MembersTab;
