import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

const AnnouncementsTab = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: "", content: "", type: "info" });
    const [creating, setCreating] = useState(false);
    
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get("announcements", auth);
            setAnnouncements(r.data || []);
        } catch (err) {
            notify("Failed to fetch announcements", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const create = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post("announcements", form, auth);
            notify("Announcement published");
            setForm({ title: "", content: "", type: "info" });
            fetchAnnouncements();
        } catch (err) {
            notify("Failed to create", "error");
        } finally {
            setCreating(false);
        }
    };

    const del = async (id) => {
        const confirmed = await confirm({
            title: 'Delete Announcement',
            message: 'Are you sure you want to delete this announcement?',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            await api.delete(`announcements/${id}`, auth);
            notify("Announcement deleted");
            fetchAnnouncements();
        } catch {
            notify("Delete failed", "error");
        }
    };

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#002147] outline-none shadow-sm transition-all";

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xl font-black mb-4">Post Announcement</h3>
                <form onSubmit={create} className="space-y-4">
                    <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputCls} required />
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls}>
                        <option value="info">Info</option>
                        <option value="alert">Alert</option>
                        <option value="success">Success</option>
                    </select>
                    <textarea placeholder="Message content..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className={inputCls} rows={3} required />
                    <button type="submit" disabled={creating} className="bg-[#002147] text-white px-6 py-2 rounded-xl font-bold">{creating ? "Posting..." : "Publish"}</button>
                </form>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Recent Announcements</h3>
                {loading ? <div className="text-center">Loading...</div> : (
                    <div className="grid gap-4">
                        {announcements.map(a => (
                            <div key={a._id} className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl flex justify-between items-start">
                                <div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${a.type === 'alert' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{a.type}</span>
                                    <h4 className="font-bold mt-2">{a.title}</h4>
                                    <p className="text-sm text-slate-500">{a.content}</p>
                                </div>
                                <button onClick={() => del(a._id)} className="text-rose-500 p-2"><i className="fas fa-trash-alt" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementsTab;
