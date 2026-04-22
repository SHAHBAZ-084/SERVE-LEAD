import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

const CertificatesTab = () => {
    const [certificates, setCertificates] = useState([]);
    const [events, setEvents] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState("view");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [issueMode, setIssueMode] = useState("single");
    const [issuing, setIssuing] = useState(false);

    const [form, setForm] = useState({
        memberId: "", eventId: "", category: "Participation",
        customCategory: "", description: "", chairmanName: "Dr. Chairman",
        title: "CERTIFICATE OF ATTENDANCE", awardType: "Official Recognition"
    });

    const debouncedSearch = useDebounce(search, 500);
    const { notify, confirm } = useNotification();
    const token = localStorage.getItem("adminToken");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const fetchCertificates = useCallback(async (currentPage = 1, searchQuery = "") => {
        setLoading(true);
        try {
            const r = await api.get(`certificates/admin/all?page=${currentPage}&limit=10&search=${searchQuery}`, auth);
            setCertificates(r.data.certificates || []);
            setTotalPages(r.data.totalPages || 1);
            setPage(r.data.currentPage || 1);
        } catch (err) {
            notify("Failed to load certificates", "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [eventsRes, membersRes] = await Promise.all([
                api.get("events/admin", auth),
                api.get("admin/members?limit=1000", auth) // Need all for dropdown
            ]);
            setEvents(eventsRes.data.events || eventsRes.data || []);
            setMembers(membersRes.data.members || []);
        } catch (err) {
            console.error("Failed to load dropdown data");
        }
    }, []);

    useEffect(() => {
        if (activeSubTab === "view") {
            fetchCertificates(page, debouncedSearch);
        } else if (activeSubTab === "issue") {
            fetchDropdownData();
        }
    }, [page, debouncedSearch, fetchCertificates, activeSubTab, fetchDropdownData]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const issueCertificate = async (e) => {
        e.preventDefault();
        setIssuing(true);
        try {
            const endpoint = issueMode === "bulk" ? "certificates/bulk" : "certificates/";
            const res = await api.post(endpoint, form, auth);
            notify(res.data.message);
            setForm({
                memberId: "", eventId: "", category: "Participation",
                customCategory: "", description: "", chairmanName: "Dr. Chairman",
                title: "CERTIFICATE OF ATTENDANCE", awardType: "Official Recognition"
            });
            setActiveSubTab("view");
            fetchCertificates(1, "");
        } catch (err) {
            notify(err.response?.data?.error || "Failed to issue certificate", "error");
        } finally {
            setIssuing(false);
        }
    };

    const revokeCertificate = async (id) => {
        const confirmed = await confirm({
            title: 'Revoke Certificate',
            message: 'Are you sure you want to permanently revoke this certificate?',
            type: 'danger',
            confirmText: 'Revoke'
        });
        if (!confirmed) return;

        try {
            await api.delete(`certificates/${id}`, auth);
            notify("Certificate revoked successfully");
            fetchCertificates(page, debouncedSearch);
        } catch (err) {
            notify("Failed to revoke", "error");
        }
    };

    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#002147] outline-none shadow-sm transition-all";

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveSubTab("view")}
                    className={`py-2 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === "view" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <i className="fas fa-list-ul mr-2"></i> Registry
                </button>
                <button
                    onClick={() => setActiveSubTab("issue")}
                    className={`py-2 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === "issue" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <i className="fas fa-plus mr-2"></i> Issue Award
                </button>
            </div>

            {activeSubTab === "issue" && (
                 <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden">
                     <h3 className="text-xl font-black mb-6">Issue Certificate</h3>
                     
                     <div className="flex gap-4 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={issueMode === "single"} onChange={() => setIssueMode("single")} name="issueMode" />
                            <span className="text-sm font-bold">Single Member</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={issueMode === "bulk"} onChange={() => setIssueMode("bulk")} name="issueMode" />
                            <span className="text-sm font-bold">Bulk Issue (Event)</span>
                        </label>
                     </div>

                     <form onSubmit={issueCertificate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {issueMode === "single" && (
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-slate-500">Select Member</label>
                                    <select value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} className={inputCls} required={issueMode === "single"}>
                                        <option value="">-- Choose --</option>
                                        {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.member_id})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold mb-1 text-slate-500">Select Event</label>
                                <select value={form.eventId} onChange={e => setForm({...form, eventId: e.target.value})} className={inputCls} required={issueMode === "bulk"}>
                                    <option value="">-- Choose --</option>
                                    {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1 text-slate-500">Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls}>
                                    <option value="Participation">Participation</option>
                                    <option value="Appreciation">Appreciation</option>
                                    <option value="Achievement">Achievement</option>
                                    <option value="Excellence">Excellence</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {form.category === "Other" && (
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-slate-500">Custom Category</label>
                                    <input type="text" value={form.customCategory} onChange={e => setForm({...form, customCategory: e.target.value})} className={inputCls} required />
                                </div>
                            )}
                             <div className="sm:col-span-2">
                                <label className="block text-xs font-bold mb-1 text-slate-500">Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputCls} rows={2} required />
                            </div>
                        </div>
                        <button type="submit" disabled={issuing} className="bg-[#002147] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                            {issuing ? "Processing..." : "Issue Certificate(s)"}
                        </button>
                     </form>
                 </div>
            )}

            {activeSubTab === "view" && (
                <div className="space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Issued Certificates</h3>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#002147]" />
                        </div>
                    </div>

                    {loading ? <Spinner /> : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-xs font-black text-slate-400 uppercase">Recipient</th>
                                            <th className="p-4 text-xs font-black text-slate-400 uppercase">Category</th>
                                            <th className="p-4 text-xs font-black text-slate-400 uppercase">Event</th>
                                            <th className="p-4 text-xs font-black text-slate-400 uppercase">Issued By</th>
                                            <th className="p-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.length === 0 ? (
                                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">No certificates found</td></tr>
                                        ) : certificates.map(cert => (
                                            <tr key={cert._id} className="border-b border-slate-50">
                                                <td className="p-4 font-bold">{cert.memberId?.name || "Unknown"} <span className="text-xs text-slate-400 block font-normal">{cert.member_id_str}</span></td>
                                                <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">{cert.category}</span></td>
                                                <td className="p-4 text-xs">{cert.eventId?.title || "N/A"}</td>
                                                <td className="p-4 text-xs text-slate-500">{cert.issuedBy?.name || "System"}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => revokeCertificate(cert._id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                                                        <i className="fas fa-ban" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="px-6 py-4 bg-slate-50 flex justify-between">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm">Prev</button>
                                    <span className="text-sm">Page {page} of {totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-sm">Next</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificatesTab;
