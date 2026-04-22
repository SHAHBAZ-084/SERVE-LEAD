import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const ApprovalsTab = () => {
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`admin/pending-members`, auth);
            setPendingMembers(r.data || []);
        } catch (err) {
            notify("Failed to load pending members", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleApproval = async (id, status, name) => {
        const confirmed = await confirm({
            title: status === 'approved' ? 'Approve Member' : 'Reject Member',
            message: `Are you sure you want to ${status} ${name}?`,
            type: status === 'approved' ? 'default' : 'danger'
        });
        if (!confirmed) return;

        setIsProcessing(true);
        try {
            await api.patch(`admin/members/${id}/approve`, { status }, auth);
            notify(`Member ${status} successfully!`);
            fetchPending();
        } catch (err) {
            notify("Action failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h2>
            {loading ? <Spinner /> : (
                <div className="grid gap-4">
                    {pendingMembers.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                             <i className="fas fa-user-clock text-5xl mb-4 opacity-10" />
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending applications</p>
                        </div>
                    ) : pendingMembers.map(m => (
                        <div key={m._id} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{m.name}</h4>
                                <p className="text-sm text-slate-500 font-medium">{m.email}</p>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">ID: {m.member_id} | Year: {m.joining_year}</p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button onClick={() => handleApproval(m._id, 'approved', m.name)} disabled={isProcessing} className="flex-1 sm:flex-none bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Approve</button>
                                <button onClick={() => handleApproval(m._id, 'rejected', m.name)} disabled={isProcessing} className="flex-1 sm:flex-none bg-rose-50 text-rose-500 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalsTab;
