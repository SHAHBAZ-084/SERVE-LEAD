import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const getImgUrl = (path) => path.startsWith('http') ? path : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${path}`;

const ParticipantsView = ({ event, onBack, auth, notify, confirm }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadParticipants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`events/${event._id}/participants?limit=1000`, auth);
            setParticipants(res.data || []);
        } catch (err) {
            notify("Failed to load participants", "error");
        } finally {
            setLoading(false);
        }
    }, [event._id, auth, notify]);

    useEffect(() => {
        loadParticipants();
    }, [loadParticipants]);

    const handleToggleAttendance = async (memberId, currentStatus) => {
        try {
            const mIdStr = String(memberId);
            await api.patch(`events/${event._id}/attendance`, { memberId: mIdStr, attended: !currentStatus }, auth);
            setParticipants(prev => prev.map(p => {
                const pMId = p.memberId?._id || p.memberId;
                return String(pMId) === mIdStr ? { ...p, attended: !currentStatus } : p;
            }));
            notify("Attendance updated!");
        } catch (err) {
            notify("Update failed", "error");
        }
    };

    const filtered = participants.filter(p => 
        p.memberId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.memberId?.member_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-up bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#002147] transition-all flex items-center gap-2 mb-2">
                        <i className="fas fa-arrow-left" /> Back to Events
                    </button>
                    <h2 className="text-2xl font-black text-[#002147] uppercase tracking-tight">{event.title}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Participant Registry</p>
                </div>
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
            </div>

            {loading ? <Spinner /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-4">Participant</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Attendance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id} className="border-b border-slate-50">
                                    <td className="p-4 font-bold">{p.memberId?.name} <span className="text-[10px] text-slate-400 block">{p.memberId?.member_id}</span></td>
                                    <td className="p-4 text-xs font-bold">{p.attended ? "Present" : "Absent"}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleToggleAttendance(p.memberId?._id || p.memberId, p.attended)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${p.attended ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}>
                                            {p.attended ? "Present" : "Mark Present"}
                                        </button>
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

const EventsTab = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState("view");
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkMode, setBulkMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", location: "", is_active: true, time: "" });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [creating, setCreating] = useState(false);
    const [participantsEvent, setParticipantsEvent] = useState(null);

    const debouncedSearch = useDebounce(search, 500);
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem("adminToken");
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const todayStr = new Date().toISOString().split('T')[0];

    const fetchEvents = useCallback(async (currentPage = 1, searchQuery = "") => {
        setLoading(true);
        try {
            const r = await api.get(`events/admin?page=${currentPage}&limit=10&search=${searchQuery}`, auth);
            setEvents(r.data.events || []);
            setTotalPages(r.data.totalPages || 1);
            setPage(r.data.currentPage || 1);
        } catch (err) {
            notify("Failed to fetch events", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        if (activeSubTab === "view") {
            fetchEvents(page, debouncedSearch);
        }
    }, [page, debouncedSearch, fetchEvents, activeSubTab]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFile(file);
        if (file) setPreview(URL.createObjectURL(file));
        else setPreview(null);
    };

    const createEvent = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("date", form.date);
            formData.append("endDate", form.endDate || form.date);
            formData.append("location", form.location);
            formData.append("is_active", form.is_active);
            formData.append("time", form.time);
            if (file) formData.append("image", file);

            await api.post("events/", formData, {
                headers: { ...auth.headers, "Content-Type": "multipart/form-data" }
            });

            notify(`Event "${form.title}" created!`);
            setForm({ title: "", description: "", date: "", endDate: "", location: "", is_active: true, time: "" });
            setFile(null); setPreview(null);
            setActiveSubTab("view");
            fetchEvents(1, "");
        } catch (err) {
            notify("Failed to create event", "error");
        } finally {
            setCreating(false);
        }
    };

    const deleteSingle = async (id) => {
        const confirmed = await confirm({
            title: 'Delete Event',
            message: 'Are you sure?',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            await api.delete(`events/${id}`, auth);
            notify("Event deleted");
            fetchEvents(page, debouncedSearch);
        } catch {
            notify("Delete failed", "error");
        }
    };

    if (participantsEvent) {
        return <ParticipantsView event={participantsEvent} onBack={() => setParticipantsEvent(null)} auth={auth} notify={notify} confirm={confirm} />;
    }

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveSubTab("view")}
                    className={`py-2 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === "view" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <i className="fas fa-list-ul mr-2"></i> View Events
                </button>
                <button
                    onClick={() => setActiveSubTab("create")}
                    className={`py-2 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === "create" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <i className="fas fa-plus mr-2"></i> Create Event
                </button>
            </div>

            {activeSubTab === "create" && (
                 <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                     <h3 className="text-xl font-black mb-6">Create New Event</h3>
                     <form onSubmit={createEvent} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl" required/>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl" required/>
                            <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl" />
                        </div>
                        <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl" rows={3} />
                        <button type="submit" disabled={creating} className="bg-[#002147] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                            {creating ? "Processing..." : "Create Event"}
                        </button>
                     </form>
                 </div>
            )}

            {activeSubTab === "view" && (
                <div className="space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Event Registry</h3>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#002147]" />
                        </div>
                    </div>

                    {loading ? <Spinner /> : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            <th className="p-4">Event</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(ev => (
                                            <tr key={ev._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-[#002147]">{ev.title}</div>
                                                    <div className="text-[10px] text-slate-400">{ev.location || "No Location"}</div>
                                                </td>
                                                <td className="p-4 text-xs font-bold">{new Date(ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button onClick={() => setParticipantsEvent(ev)} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                                                        Registry
                                                    </button>
                                                    <button onClick={() => deleteSingle(ev._id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                                                        <i className="fas fa-trash-alt" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="px-6 py-4 bg-slate-50 flex justify-between border-t border-slate-100">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prev</button>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsTab;
