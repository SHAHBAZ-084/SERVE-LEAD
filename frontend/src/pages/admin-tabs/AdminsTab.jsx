import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const AdminsTab = ({ adminUser }) => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "", joining_year: new Date().getFullYear(), member_id: "", role: "Admin" });
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
    
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`admin/members?limit=1000`, auth);
            setAdmins((r.data.members || r.data || []).filter(m => m.role === "Admin" || m.role === "Superuser"));
        } catch (err) {
            notify("Failed to load admins", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const createAdmin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("admin/members/add/", form, auth);
            notify(`Admin account ${form.member_id} created!`);
            setForm({ name: "", email: "", password: "", joining_year: new Date().getFullYear(), member_id: "", role: "Admin" });
            fetchAdmins();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to create", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteAdmin = async (id) => {
        const confirmed = await confirm({
            title: 'Delete Admin',
            message: `Delete admin ${id}? This action is irreversible.`,
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            await api.delete(`admin/members/${id}/delete/`, auth);
            notify(`Admin ${id} deleted`);
            fetchAdmins();
        } catch {
            notify("Delete failed", "error");
        }
    };

    const toggleBlock = async (id) => {
        try {
            const r = await api.patch(`admin/members/${id}/toggle-block`, {}, auth);
            notify(r.data.message);
            fetchAdmins();
        } catch (err) {
            notify("Action failed", "error");
        }
    };

    const updateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.put(`admin/members/${editing}/update`, editForm, auth);
            notify(`Admin ${editing} updated successfully`);
            setEditing(null);
            fetchAdmins();
        } catch (err) {
            notify("Update failed", "error");
        }
    };

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#002147] outline-none shadow-sm transition-all";

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
                <h3 className="text-lg font-black mb-6 uppercase tracking-tight">Register New Administrator</h3>
                <form onSubmit={createAdmin} className="space-y-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} required />
                        <input type="text" placeholder="Member ID" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} className={inputCls} required />
                        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} required />
                        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} required />
                        <input type="number" value={form.joining_year} onChange={e => setForm({ ...form, joining_year: e.target.value })} className={inputCls} required />
                    </div>
                    <button type="submit" disabled={submitting} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold">{submitting ? "Processing..." : "Register Admin"}</button>
                </form>
            </div>

            {loading ? <Spinner /> : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">ID/Name</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase">Role</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(m => (
                                <tr key={m._id} className="border-b border-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold">{m.name}</div>
                                        <div className="text-[10px] text-indigo-600 font-bold uppercase">{m.member_id}</div>
                                    </td>
                                    <td className="p-4"><span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded">{m.role}</span></td>
                                    <td className="p-4 text-right">
                                        {m.member_id !== adminUser ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => toggleBlock(m._id)} className={`text-[10px] font-bold uppercase ${m.status === 'blocked' ? 'text-emerald-500' : 'text-amber-500'}`}>{m.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                                                <button onClick={() => { setEditing(m.member_id); setEditForm({ name: m.name, email: m.email, password: "" }); }} className="text-slate-500"><i className="fas fa-edit" /></button>
                                                <button onClick={() => deleteAdmin(m.member_id)} className="text-rose-500"><i className="fas fa-trash-alt" /></button>
                                            </div>
                                        ) : <span className="text-xs text-slate-300 italic">You</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminsTab;
