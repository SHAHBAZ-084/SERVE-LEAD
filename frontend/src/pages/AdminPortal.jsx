import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getImgUrl, API_BASE as API_BASE_URL } from "../api";
import CountdownTimer from "../components/common/CountdownTimer";
import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { inputCls, useCountUp, StatCard, Spinner } from "../components/common/AdminUiComponents";

// ── Batches Tab (Refactored Standalone) ───────────────────
const BatchesTab = ({ members, issuedCertificates, auth, api, notify, setSearchParams }) => {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchSearch, setBatchSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Group members by their joining date using the Sep 1st boundary
    const calculateBatch = (dateStr) => {
        if (!dateStr) return new Date().getFullYear();
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return new Date().getFullYear();
        const year = date.getFullYear();
        const month = date.getMonth(); // 0 is Jan, 8 is Sept
        return month >= 8 ? year : year - 1;
    };

    // 1. Identify active members
    const activeMembers = (members || []).filter(m => m && m.role !== 'Admin' && m.role !== 'Superuser');
    const activeIds = new Set(activeMembers.map(m => m.member_id));

    // 2. Extract unique historical members from certificates that are no longer in the active list
    const historicalShadows = [];
    const seenHistoricalIds = new Set();

    (issuedCertificates || []).forEach(cert => {
        const idStr = cert.member_id_str || cert.memberId?.member_id;
        const nameStr = cert.memberName || cert.memberId?.name;

        if (idStr && !activeIds.has(idStr) && !seenHistoricalIds.has(idStr)) {
            historicalShadows.push({
                _id: `hist-${idStr}`,
                member_id: idStr,
                name: nameStr,
                createdAt: cert.createdAt,
                isHistorical: true,
                role: 'General'
            });
            seenHistoricalIds.add(idStr);
        }
    });

    // 3. Complete Registry (Active + Historical)
    const completeRegistry = [...activeMembers, ...historicalShadows];

    const batchData = completeRegistry.reduce((acc, m) => {
        const batchYear = calculateBatch(m.createdAt);
        if (!acc[batchYear]) acc[batchYear] = [];
        acc[batchYear].push(m);
        return acc;
    }, {});

    const sortedBatchYears = Object.keys(batchData).sort((a, b) => b - a);

    if (selectedBatch) {
        const batchMembers = (batchData[selectedBatch] || []).filter(m =>
            (m.name || "").toLowerCase().includes(batchSearch.toLowerCase()) ||
            (m.member_id || "").toLowerCase().includes(batchSearch.toLowerCase())
        );

        const totalPages = Math.ceil(batchMembers.length / itemsPerPage);
        const paginatedMembers = batchMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
            <div className="space-y-8 animate-fade-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <button onClick={() => { setSelectedBatch(null); setBatchSearch(""); setCurrentPage(1); }} className="flex items-center gap-2 text-slate-400 hover:text-[#002147] transition-colors text-xs font-black uppercase tracking-widest leading-none bg-transparent border-none cursor-pointer">
                        <i className="fas fa-arrow-left" /> Back to Overview
                    </button>

                    <div className="flex-1 max-w-md w-full relative">
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder={`Search in Batch ${selectedBatch}...`}
                            value={batchSearch}
                            onChange={(e) => { setBatchSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-0  outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="sm:hidden space-y-4">
                    {paginatedMembers.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No members found</p>
                        </div>
                    ) : paginatedMembers.map(m => (
                        <div key={m._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <i className="fas fa-id-card text-6xl" />
                            </div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-100 text-[#002147] rounded-2xl flex items-center justify-center text-xl font-black shadow-inner border border-white">
                                        {(m.name || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 tracking-tight leading-none mb-1.5">
                                            {m.name}
                                            {m.isHistorical && <span className="ml-2 text-[8px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100">DELETED</span>}
                                        </span>
                                        <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">{m.member_id || 'PENDING'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Joined</span>
                                    <span className="text-[10px] font-bold text-slate-600 block">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                            <button onClick={() => setSearchParams({ tab: 'batches', dossier: m._id })} className="w-full bg-[#002147] text-white py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-900/10">
                                <i className="fas fa-eye mr-2" /> View Dossier
                            </button>
                        </div>
                    ))}
                </div>

                <div className="hidden sm:block bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Identity</th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Joining Date</th>
                                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                {paginatedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center text-slate-300">
                                            <p className="text-xs font-bold uppercase tracking-widest">No members found in this batch</p>
                                        </td>
                                    </tr>
                                ) : paginatedMembers.map(m => (
                                    <tr key={m._id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 tracking-tight leading-none mb-1.5">
                                                    {m.name}
                                                    {m.isHistorical && <span className="ml-2 text-[8px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100">DELETED</span>}
                                                </span>
                                                <span className="text-xs font-bold text-[#003366] uppercase tracking-widest">{m.member_id || 'PENDING'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-500">
                                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => setSearchParams({ tab: 'batches', dossier: m._id })} className="text-xs bg-slate-900 shadow-lg shadow-black/10 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-black uppercase tracking-widest leading-none">
                                                <i className="fas fa-eye mr-2" /> View Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <i className="fas fa-arrow-left mr-2" /> Prev
                        </button>

                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next <i className="fas fa-arrow-right ml-2" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-up">
            <div className="relative p-12 rounded-[3.5rem] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] -mr-48 -mt-48" />
                <div className="relative z-10 text-left">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Society Batches</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">Seasonal Grouping (Sep 1st Boundary)</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedBatchYears.map(year => (
                    <button key={year} onClick={() => { setSelectedBatch(year); setCurrentPage(1); }} className="group p-10 bg-white border border-slate-100 rounded-[3rem] shadow-2xl hover:-translate-y-3 transition-all text-left relative overflow-hidden active:scale-95">
                        <div className="absolute top-0 right-0 p-8 text-[#002147]/5 group-hover:text-[#002147]/10 transition-colors"><i className="fas fa-calendar-alt text-8xl rotate-12" /></div>
                        <h4 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Batch {year}</h4>
                        <p className="text-[#003366] text-xs font-bold uppercase tracking-widest">{batchData[year].length} Members</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ── Main Portal ───────────────────────────────────────────
// ── Customization Tab (SUPERUSER ONLY) ──────────────────
const CustomizationTabComponent = ({ auth, notify, getImgUrl, inputCls, api, members }) => {
    const [activeSubTab, setActiveSubTab] = useState("donation");
    const [channels, setChannels] = useState([]);
    const [teamStructure, setTeamStructure] = useState([]);
    const [leadership, setLeadership] = useState({ name: "", role: "", program: "", desc: "", img: "", email: "", email_subject: "Inquiry regarding Serve & Lead Society", email_body: "Hello Chairman,\n\nI am reaching out to..." });
    const [vision, setVision] = useState({
        badgeSubtitle: "Chairman Vision",
        badgeName: "Farooq Baloch",
        mainTitle: "Empowering student leaders for a better Pakistan.",
        quote: "As Chairman of Serve and Lead Society Lahore (SLS), my vision is to empower students by creating elite opportunities for leadership and career excellence. We strive to build a strong community where financial challenges never become a barrier to excellence.",
        img: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [waLink, setWaLink] = useState("");

    // Admin Promotion State
    const [adminSearch, setAdminSearch] = useState("");
    const [foundMembers, setFoundMembers] = useState([]);

    const PAK_BANKS = [
        "Meezan Bank", "Habib Bank Limited (HBL)", "United Bank Limited (UBL)",
        "Allied Bank Limited (ABL)", "MCB Bank", "Bank Alfalah", "Bank of Punjab (BOP)",
        "Askari Bank", "Faysal Bank", "National Bank of Pakistan (NBP)",
        "Dubai Islamic Bank", "Standard Chartered", "Habib Metro", "Soneri Bank",
        "Al Baraka Bank", "Bank Al Habib", "JS Bank", "Samba Bank", "Silk Bank",
        "Summit Bank", "Sindh Bank", "SadaPay", "NayaPay"
    ];

    useEffect(() => {
        api.get("settings").then(r => {
            if (r.data.donation_channels) {
                try { setChannels(JSON.parse(r.data.donation_channels)); } catch { setChannels([]); }
            }
            if (r.data.team_structure) {
                try { setTeamStructure(JSON.parse(r.data.team_structure)); } catch { setTeamStructure([]); }
            }
            if (r.data.team_leadership) {
                try { setLeadership(JSON.parse(r.data.team_leadership)); } catch { setLeadership({ name: "", role: "", program: "", desc: "", img: "" }); }
            }
            if (r.data.vision_section) {
                try { setVision(JSON.parse(r.data.vision_section)); } catch {
                    setVision({
                        badgeSubtitle: "Chairman Vision",
                        badgeName: "Farooq Baloch",
                        mainTitle: "Empowering student leaders for a better Pakistan.",
                        quote: "As Chairman of Serve and Lead Society Lahore (SLS), my vision is to empower students by creating elite opportunities for leadership and career excellence. We strive to build a strong community where financial challenges never become a barrier to excellence.",
                        img: ""
                    });
                }
            }
        });
        api.get("settings/whatsapp-link").then(r => setWaLink(r.data.link || ""));
    }, [api]);

    useEffect(() => {
        if (adminSearch.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                api.get(`admin/members?search=${adminSearch}`, auth).then(r => {
                    setFoundMembers(r.data.members.filter(m => m.role === 'General'));
                }).catch(() => setFoundMembers([]));
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setFoundMembers([]);
        }
    }, [adminSearch]);

    const save = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await api.put("settings", {
                donation_channels: JSON.stringify(channels),
                team_structure: JSON.stringify(teamStructure),
                team_leadership: JSON.stringify(leadership),
                vision_section: JSON.stringify(vision)
            }, auth);
            notify("System customization updated successfully!");
        } catch { notify("Failed to update settings", "error"); }
        finally { setSubmitting(false); }
    };

    const saveWaLink = async () => {
        setSubmitting(true);
        try {
            await api.put("settings/whatsapp-link", { link: waLink }, auth);
            notify("WhatsApp link updated!");
        } catch { notify("Failed to update WhatsApp link", "error"); }
        finally { setSubmitting(false); }
    };

    const saveLeadership = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await api.put("settings", {
                team_leadership: JSON.stringify(leadership)
            }, auth);
            notify("Leadership profile updated successfully!");
        } catch { notify("Failed to update leadership", "error"); }
        finally { setSubmitting(false); }
    };

    const promoteMember = async (id, name) => {
        if (!window.confirm(`Promote ${name} to Administrator role?`)) return;
        setSubmitting(true);
        try {
            await api.patch(`admin/members/${id}/promote`, {}, auth);
            notify(`${name} is now an Admin!`);
            setAdminSearch("");
            setFoundMembers([]);
        } catch (err) { notify(err.response?.data?.error || "Promotion failed", "error"); }
        finally { setSubmitting(false); }
    };

    const addChannel = (type) => {
        const newChannel = type === 'Bank'
            ? { id: Date.now(), type: 'Bank', bankName: PAK_BANKS[0], iban: "", accountNumber: "" }
            : { id: Date.now(), type: 'Wallet', walletType: 'EasyPaisa', number: "" };
        setChannels([...channels, newChannel]);
    };

    const updateChannel = (id, field, value) => setChannels(channels.map(c => c.id === id ? { ...c, [field]: value } : c));
    const removeChannel = (id) => setChannels(channels.filter(c => c.id !== id));
    const addCategory = () => setTeamStructure([...teamStructure, { id: Date.now(), name: "N/A Category", members: [] }]);
    const updateCategory = (id, name) => setTeamStructure(teamStructure.map(c => c.id === id ? { ...c, name } : c));
    const removeCategory = (id) => setTeamStructure(teamStructure.filter(c => c.id !== id));

    const addMember = (catId) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: [...c.members, { id: Date.now(), name: "Full Name", role: "Role", program: "Program", desc: "Bio", img: "" }]
        } : c));
    };

    const updateMember = (catId, memberId, field, value) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: c.members.map(m => m.id === memberId ? { ...m, [field]: value } : m)
        } : c));
    };

    const removeMember = (catId, memberId) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: c.members.filter(m => m.id !== memberId)
        } : c));
    };

    const uploadPhoto = async (catId, memberId, file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const r = await api.post('settings/upload', formData, auth);
            if (catId === 'leadership') setLeadership({ ...leadership, img: r.data.imageUrl });
            else if (catId === 'vision') setVision({ ...vision, img: r.data.imageUrl });
            else updateMember(catId, memberId, 'img', r.data.imageUrl);
            notify("Photo uploaded successfully!");
        } catch { notify("Photo upload failed", "error"); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-up pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-2 bg-slate-200/50 rounded-2xl w-full sm:w-fit">
                <button onClick={() => setActiveSubTab("donation")} className={`py-2.5 px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === "donation" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    <i className="fas fa-money-check-dollar"></i> <span className="sm:inline">Financials</span>
                </button>
                <button onClick={() => setActiveSubTab("team")} className={`py-2.5 px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === "team" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    <i className="fas fa-users-gear"></i> <span className="sm:inline">Management</span>
                </button>
                <button onClick={() => setActiveSubTab("vision")} className={`py-2.5 px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === "vision" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    <i className="fas fa-eye"></i> <span className="sm:inline">Vision Section</span>
                </button>
                {auth.is_superuser && (
                    <button onClick={() => setActiveSubTab("admins")} className={`py-2.5 px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === "admins" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                        <i className="fas fa-shield-halved"></i> <span className="sm:inline">Admins</span>
                    </button>
                )}
            </div>

            {activeSubTab === "donation" && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
                    <div className="p-8 md:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                    <i className="fas fa-money-bill-transfer" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Financial Channels</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global donation and account settings</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button type="button" onClick={() => addChannel('Wallet')} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">+ Wallet</button>
                                <button type="button" onClick={() => addChannel('Bank')} className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100">+ Bank</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {channels.length === 0 && <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">No channels configured</div>}
                            <div className="grid grid-cols-1 gap-6">
                                {channels.map((ch) => (
                                    <div key={ch.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200/60 relative group">
                                        <button type="button" onClick={() => removeChannel(ch.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-2"><i className="fas fa-trash-alt text-sm" /></button>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${ch.type === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}><i className={`fas ${ch.type === 'Bank' ? 'fa-building-columns' : 'fa-mobile-screen'}`} /></div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{ch.type} Channel</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {ch.type === 'Wallet' ? (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Wallet Type</label>
                                                        <select value={ch.walletType} onChange={e => updateChannel(ch.id, 'walletType', e.target.value)} className={inputCls}><option>EasyPaisa</option><option>JazzCash</option><option>SadaPay</option><option>NayaPay</option></select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Account Number</label>
                                                        <input type="text" maxLength={11} placeholder="03XXXXXXXXX" value={ch.number} onChange={e => updateChannel(ch.id, 'number', e.target.value)} className={inputCls} required />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Bank</label>
                                                        <select value={ch.bankName} onChange={e => updateChannel(ch.id, 'bankName', e.target.value)} className={inputCls}>{PAK_BANKS.map(b => <option key={b}>{b}</option>)}</select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Account #</label>
                                                        <input type="text" value={ch.accountNumber} onChange={e => updateChannel(ch.id, 'accountNumber', e.target.value)} className={inputCls} required />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">IBAN</label>
                                                        <input type="text" value={ch.iban} onChange={e => updateChannel(ch.id, 'iban', e.target.value)} className={inputCls} required />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Group Link Setting */}
                    <div className="p-8 md:p-10 border-t border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="flex-1 w-full">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">WhatsApp Group Link (For Success Screen)</label>
                                <div className="flex gap-3">
                                    <input type="text" placeholder="https://chat.whatsapp.com/..." value={waLink} onChange={e => setWaLink(e.target.value)} className={inputCls} />
                                    <button type="button" onClick={saveWaLink} disabled={submitting} className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50">
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === "team" && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700" />
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                        <i className="fas fa-user-shield" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Society Leadership</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Chairman / Principal Figure</p>
                                    </div>
                                </div>
                                <button type="button" onClick={saveLeadership} disabled={submitting} className="w-full sm:w-auto px-5 py-2.5 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md disabled:opacity-50">
                                    <i className="fas fa-save mr-1.5" />
                                    {submitting ? "Saving..." : "Save Profile"}
                                </button>
                            </div>

                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group flex-shrink-0">
                                    {leadership.img ? <img src={getImgUrl(leadership.img)} className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-black uppercase">{leadership.name?.charAt(0) || "L"}</div>}
                                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <i className="fas fa-camera text-white text-lg" />
                                        <input type="file" className="hidden" accept="image/*" onChange={e => uploadPhoto('leadership', null, e.target.files[0])} />
                                    </label>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                                        <input type="text" value={leadership.name} onChange={e => setLeadership({ ...leadership, name: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Primary Title</label>
                                        <input type="text" value={leadership.role} onChange={e => setLeadership({ ...leadership, role: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Gmail Address</label>
                                        <input type="email" value={leadership.email} onChange={e => setLeadership({ ...leadership, email: e.target.value })} className={inputCls} placeholder="chairman@gmail.com" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Default Email Subject</label>
                                        <input type="text" value={leadership.email_subject} onChange={e => setLeadership({ ...leadership, email_subject: e.target.value })} className={inputCls} placeholder="e.g. Society Inquiry" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Auto-Message Body</label>
                                        <textarea rows={1} value={leadership.email_body} onChange={e => setLeadership({ ...leadership, email_body: e.target.value })} className={inputCls} placeholder="Pre-filled message for visitors..." />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Professional Bio</label>
                                        <textarea rows={2} value={leadership.desc} onChange={e => setLeadership({ ...leadership, desc: e.target.value })} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600" />
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                        <i className="fas fa-users-gear" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Team Hierarchy</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Society Chapters & Core Members</p>
                                    </div>
                                </div>
                                <button type="button" onClick={addCategory} className="px-5 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all">
                                    + Add Category
                                </button>
                            </div>

                            <div className="space-y-10">
                                {teamStructure.map((cat) => (
                                    <div key={cat.id} className="space-y-6">
                                        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                                            <input type="text" value={cat.name} onChange={e => updateCategory(cat.id, e.target.value)}
                                                className="text-xs font-black text-slate-400 hover:text-purple-600 transition-colors uppercase tracking-[0.2em] bg-transparent border-none focus:ring-0 p-0" />
                                            <button type="button" onClick={() => addMember(cat.id)} className="ml-auto text-[10px] font-black uppercase text-purple-600 hover:underline">Add Member</button>
                                            <button type="button" onClick={() => removeCategory(cat.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-1"><i className="fas fa-trash-alt text-xs" /></button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {cat.members.map((m) => (
                                                <div key={m.id} className="p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative group flex flex-col sm:flex-row gap-5 sm:gap-6 items-center">
                                                    <button type="button" onClick={() => removeMember(cat.id, m.id)} className="absolute top-2 right-2 text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-times" /></button>

                                                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group/img flex-shrink-0">
                                                        {m.img ? <img src={getImgUrl(m.img)} className="w-full h-full object-cover" /> :
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl"><i className="fas fa-user" /></div>}
                                                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                                            <i className="fas fa-camera text-white text-xs" />
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => uploadPhoto(cat.id, m.id, e.target.files[0])} />
                                                        </label>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                                        <input type="text" placeholder="Full Name" value={m.name} onChange={e => updateMember(cat.id, m.id, 'name', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <input type="text" placeholder="Designation" value={m.role} onChange={e => updateMember(cat.id, m.id, 'role', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <input type="text" placeholder="Program/Field" value={m.program} onChange={e => updateMember(cat.id, m.id, 'program', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <textarea placeholder="Bio description..." rows={1} value={m.desc} onChange={e => updateMember(cat.id, m.id, 'desc', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 resize-none" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === "vision" && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                        <i className="fas fa-eye" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Home Page Vision</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Chairman Vision Section Customization</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Image & Badge Section */}
                                <div className="p-4 sm:p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center md:flex-row gap-6 sm:gap-8">
                                    <div className="w-full max-w-[200px] aspect-[4/5] sm:w-48 sm:h-60 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group flex-shrink-0 animate-fade-up">
                                        {vision.img ? <img src={getImgUrl(vision.img)} className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                                <i className="fas fa-image text-3xl mb-2" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">No Custom Image</span>
                                            </div>}
                                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-[2px]">
                                            <i className="fas fa-camera text-white text-xl mb-2" />
                                            <span className="text-[9px] text-white font-black uppercase tracking-widest">Update Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => uploadPhoto('vision', null, e.target.files[0])} />
                                        </label>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Badge Subtitle (e.g. Chairman Vision)</label>
                                            <input type="text" value={vision.badgeSubtitle} onChange={e => setVision({ ...vision, badgeSubtitle: e.target.value })} className={inputCls} placeholder="Chairman Vision" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Badge Name (e.g. Farooq Baloch)</label>
                                            <input type="text" value={vision.badgeName} onChange={e => setVision({ ...vision, badgeName: e.target.value })} className={inputCls} placeholder="Farooq Baloch" />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Vision Section Main Title</label>
                                            <input type="text" value={vision.mainTitle} onChange={e => setVision({ ...vision, mainTitle: e.target.value })} className={inputCls} placeholder="Empowering student leaders..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Section */}
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                    <label className="text-[9px] font-black text-[#002147] uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <i className="fas fa-quote-left text-emerald-500" />
                                        Vision Quote Content
                                    </label>
                                    <textarea rows={4} value={vision.quote} onChange={e => setVision({ ...vision, quote: e.target.value })} className={`${inputCls} font-medium text-slate-600 italic leading-relaxed`} placeholder="Enter the chairman's vision statement..." />
                                    <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                        <i className="fas fa-info-circle" />
                                        This text appears in the prominent quote block next to the image.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Actions */}
            <div className="flex justify-center sm:justify-end pt-4 pb-2">
                <button type="button" onClick={save} disabled={submitting}
                    className="w-full sm:w-auto px-8 py-4 sm:px-6 sm:py-3.5 bg-[#002147] text-white rounded-2xl sm:rounded-xl text-xs sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 flex items-center justify-center gap-3">
                    {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-cloud-arrow-up text-sm sm:text-xs" />}
                    Apply All Changes
                </button>
            </div>
        </div>
    );
};

// ── Certificates Tab (DYNAMIC GENERATOR) ──────────────────
const CertificatesTab = ({ auth, notify, api, members, events }) => {
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportData, setExportData] = useState(null);
    const [searchMember, setSearchMember] = useState("");
    const [searchCert, setSearchCert] = useState("");
    const [selectedCertIds, setSelectedCertIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const [form, setForm] = useState({
        memberId: "",
        eventId: "",
        category: "Appreciation",
        customCategory: "",
        description: "For their outstanding contribution and dedication to the society's goals and initiatives.",
        chairmanName: "Chairman SLS",
        title: "CERTIFICATE OF MEMBERSHIP",
        awardType: "Official Membership"
    });

    const [certAssets, setCertAssets] = useState({ logo: null, seal: null });

    useEffect(() => {
        fetchCertificates();

        // Pre-load assets into Base64 to bypass CORS/Taint issues during capture
        const loadToDataURL = async (url, key) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setCertAssets(prev => ({ ...prev, [key]: reader.result }));
                reader.readAsDataURL(blob);
            } catch (err) {
                console.error(`Failed to load ${key} as Base64:`, e);
            }
        };
        loadToDataURL(logo, 'logo');
        loadToDataURL(sealImg, 'seal');
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const r = await api.get("certificates/admin/all", auth);
            // Filter out certificates issued to Admins or Superusers
            const nonAdminCerts = r.data.filter(c => {
                const role = c.memberId?.role;
                return role && role !== 'Admin' && role !== 'Superuser';
            });
            setIssuedCertificates(nonAdminCerts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleIssue = async () => {
        if (!form.memberId) return notify("Please select a member", "error");
        setSubmitting(true);
        try {
            await api.post("certificates", form, auth);
            notify("Certificate issued successfully!");
            setShowForm(false);
            setForm({
                memberId: "",
                eventId: "",
                category: "Appreciation",
                customCategory: "",
                description: "For their outstanding contribution and dedication to the society's goals and initiatives.",
                chairmanName: "Chairman SLS",
                title: "CERTIFICATE OF MEMBERSHIP",
                awardType: "Official Membership"
            });
            setSearchMember("");
            fetchCertificates();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to issue certificate", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkIssue = async () => {
        if (!form.eventId) return notify("Please select an event for bulk issuance", "error");
        setSubmitting(true);
        try {
            const r = await api.post("certificates/bulk", form, auth);
            notify(`Successfully issued ${r.data.count} certificates!`);
            setShowForm(false);
            setForm({
                memberId: "",
                eventId: "",
                category: "Appreciation",
                customCategory: "",
                description: "For their outstanding contribution and dedication to the society's goals and initiatives.",
                chairmanName: "Chairman SLS",
                title: "CERTIFICATE OF MEMBERSHIP",
                awardType: "Official Membership"
            });
            setSearchMember("");
            fetchCertificates();
        } catch (err) {
            notify(err.response?.data?.error || "Failed to bulk issue certificates", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const downloadPDF = async (certData) => {
        setExportData(certData);
        notify("Preparing Isolated Sandbox for high-resolution document...");

        try {
            // 1. Create a hidden iframe sandbox
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '794px';
            iframe.style.height = '1123px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.style.zIndex = '-1000';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // 2. Inject barebones HTML with ONLY the necessary fonts (NO TAILWIND)
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Dancing+Script:wght@400..700&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 0; background: white; }
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                        h1, h2, h3, p { margin: 0; padding: 0; }
                    </style>
                </head>
                <body>
                    <div id="sandbox-root"></div>
                </body>
                </html>
            `);
            iframeDoc.close();

            // 3. Wait for fonts in the sandbox to load
            await new Promise(r => setTimeout(r, 1000));
            await iframeDoc.fonts.ready;

            // 4. Clone the purified certificate node into the sandbox
            const sourceElement = document.getElementById('cert-export-node');
            if (!sourceElement) throw new Error("Export engine not found in DOM");

            const clonedNode = sourceElement.cloneNode(true);
            clonedNode.style.opacity = '1';
            clonedNode.style.visibility = 'visible';
            clonedNode.style.display = 'block';

            iframeDoc.getElementById('sandbox-root').appendChild(clonedNode);

            // 5. High-Resolution Capture from the Sandbox
            const canvas = await html2canvas(clonedNode, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 794,
                windowHeight: 1123
            });

            // 6. Generate PDF and Cleanup
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            pdf.save(`SLS_Official_${certData.memberId?.name?.replace(/\s+/g, '_') || 'Award'}.pdf`);

            // Final Cleanup
            document.body.removeChild(iframe);
            notify("PDF Generated Successfully!");
        } catch (err) {
            console.error("PDF Export Error:", err);
            notify(`PDF Error: ${err.message}`, "error");
        } finally {
            setExportData(null);
        }
    };

    const revokeCertificate = async (id) => {
        if (!window.confirm("Are you sure you want to revoke this certificate?")) return;
        try {
            await api.delete(`certificates/${id}`, auth);
            notify("Certificate revoked successfully");
            fetchCertificates();
        } catch (err) {
            notify("Failed to revoke certificate", "error");
        }
    };

    const toggleCertSelect = (id) => setSelectedCertIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const handleSelectAllCerts = (e) => setSelectedCertIds(e.target.checked ? issuedCertificates.map(c => c._id) : []);

    const handleBulkRevoke = async () => {
        if (!window.confirm(`Are you sure you want to revoke ${selectedCertIds.length} certificates?`)) return;
        setIsRevoking(true);
        let count = 0;
        await Promise.all(selectedCertIds.map(async id => {
            try {
                await api.delete(`certificates/${id}`, auth);
                count++;
            } catch (e) { }
        }));
        notify(`Successfully revoked ${count} certificates`);
        fetchCertificates();
        setSelectedCertIds([]);
        setIsRevoking(false);
    };

    const handleBulkDownload = async () => {
        setIsDownloading(true);
        notify(`Starting batch download for ${selectedCertIds.length} items...`);

        for (const id of selectedCertIds) {
            const cert = issuedCertificates.find(c => c._id === id);
            if (cert) {
                try {
                    await downloadPDF(cert);
                    // Add a small delay for browser stability
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    console.error("Bulk Download Error:", e);
                }
            }
        }

        notify("Batch export completed!");
        setSelectedCertIds([]);
        setIsDownloading(false);
    };

    const filteredMembers = members.filter(m =>
        (m.role !== 'Admin' && m.role !== 'Superuser') && (
            m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
            m.member_id.toLowerCase().includes(searchMember.toLowerCase())
        )
    );

    const selectedMember = members.find(m => m._id === form.memberId);
    const selectedEvent = events.find(e => e._id === form.eventId);

    const updateDefaultDescription = (cat) => {
        let desc = "";
        if (cat === "Appreciation") desc = "For their outstanding contribution and dedication to the society's goals and initiatives.";
        else if (cat === "Achievement") desc = "In recognition of their exceptional performance and reaching significant milestones within the society.";
        else if (cat === "Participation") desc = "For their active participation and engagement in society events and programs.";
        else if (cat === "Excellence") desc = "Awarded for demonstrating excellence and high standards of brilliance in their assigned responsibilities.";

        setForm({ ...form, category: cat, description: desc || form.description });
    };

    const CertificateTemplate = ({ data, id }) => (
        <div id={id} style={{ position: 'relative', width: '794px', height: '1123px', padding: '60px', fontFamily: '"Playfair Display", serif', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: '0 auto', overflow: 'hidden', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}>
            {/* Outer Double Blue Border */}
            <div style={{ position: 'absolute', top: '16px', bottom: '16px', left: '16px', right: '16px', border: '1px solid #002147', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '1px solid #002147', pointerEvents: 'none' }} />

            {/* Logo/Header Section */}
            <div style={{ paddingTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={certAssets.logo || logo} alt="Logo" style={{ height: '120px', marginBottom: '8px', objectFit: 'contain' }} />
                <p style={{ color: '#002147', fontSize: '15px', fontStyle: 'italic', marginBottom: '8px', letterSpacing: '0.025em', fontWeight: '500' }}>Building Leaders Through Service</p>
                <h1 style={{ fontFamily: '"Playfair Display", serif', color: '#002147', fontSize: '44px', fontWeight: '900', lineHeight: 1, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '-0.025em' }}>
                    {data.title || "CERTIFICATE OF MEMBERSHIP"}
                </h1>
                <div style={{ textAlign: 'center', fontFamily: 'sans-serif', paddingLeft: '40px', paddingRight: '40px', lineHeight: 1.6, fontSize: '15px', color: '#475569' }}>
                    <p>
                        This is to certify that the individual named below has been duly granted <br />
                        <strong style={{ fontWeight: 'bold', color: '#002147' }}>{data.awardType || "Official Membership"}</strong> in the Serve & Lead Society (SLS-UET).
                    </p>
                </div>
            </div>

            {/* Name Section with Yellow Lines - Professional Upgrade */}
            <div style={{ marginTop: '48px', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '40px', paddingRight: '40px' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ height: '2px', width: '48px', borderRadius: '9999px', position: 'relative', flexShrink: 0, backgroundColor: '#FFD700', marginRight: '24px', marginTop: '10px' }}>
                        <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', transform: 'rotate(45deg)', backgroundColor: '#FFD700' }} />
                    </div>
                    <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '52px', lineHeight: 1.1, color: '#1a1a1a', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
                        {data.memberId?.name || "Member Name"}
                    </h2>
                    <div style={{ height: '2px', width: '48px', borderRadius: '9999px', position: 'relative', flexShrink: 0, backgroundColor: '#FFD700', marginLeft: '24px', marginTop: '10px' }}>
                        <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', transform: 'rotate(45deg)', backgroundColor: '#FFD700' }} />
                    </div>
                </div>
            </div>

            {/* Member Information Box */}
            <div style={{ marginLeft: '40px', marginRight: '40px', border: '1px solid #002147', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#002147', paddingTop: '8px', paddingBottom: '8px', textAlign: 'center' }}>
                    <h3 style={{ border: 'none', color: '#ffffff', fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.2em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>MEMBER INFORMATION</h3>
                </div>
                <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: '12px', fontSize: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#002147' }}>Membership ID:</span>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{data.memberId?.member_id || "2025-SLS-UET1"}</span>

                        <span style={{ fontWeight: 'bold', color: '#002147' }}>Joining Date:</span>
                        <span style={{ fontWeight: '500', color: '#334155' }}>
                            {new Date(data.memberId?.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>

                        <span style={{ fontWeight: 'bold', color: '#002147' }}>Status:</span>
                        <span style={{ fontWeight: '500', color: '#334155' }}>Member from UET Lahore</span>
                    </div>
                </div>
            </div>

            {/* Specific Terms Text Block */}
            <div style={{ marginTop: '48px', marginLeft: '40px', marginRight: '40px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: 1.6, paddingLeft: '40px', paddingRight: '40px', color: '#334155' }}>
                <p>
                    {data.description || "The bearer of this certificate is entitled to all privileges and responsibilities associated with the General Membership."}
                </p>

                <div style={{ marginTop: '24px', fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>
                    <p>
                        Valid from {new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} until {new Date(new Date(data.createdAt || Date.now()).setFullYear(new Date(data.createdAt || Date.now()).getFullYear() + 1)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <p style={{ textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: 'bold', color: '#1e293b' }}>
                        Issued on: {new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Authentication: Seal & Signature */}
            <div style={{ position: 'absolute', bottom: '64px', left: '60px', right: '60px', height: '180px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', boxSizing: 'border-box' }}>
                {/* Official Red PNG Seal (Bottom Left) */}
                <div style={{ position: 'relative', transform: 'rotate(-8deg) scale(0.85) translateX(45px)', opacity: 0.9, userSelect: 'none', pointerEvents: 'none', transformOrigin: 'bottom left' }}>
                    <img src={certAssets.seal || sealImg} alt="Seal" style={{ width: '180px', height: '180px', objectFit: 'contain', filter: 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))' }} />
                </div>

                {/* Hand-written Signature (Bottom Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingRight: '20px' }}>
                    <div style={{ position: 'relative', marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <p style={{ fontSize: '42px', lineHeight: 1, marginBottom: '4px', fontFamily: '"Dancing Script", cursive', color: '#1e293b', opacity: 0.85, fontWeight: 'normal', margin: 0 }}>
                            {data.chairmanName || "Farooq Baloch"}
                        </p>
                        <div style={{ width: '200px', height: '1px', backgroundColor: '#1e293b' }} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <p style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '-0.025em', textDecoration: 'underline', textUnderlineOffset: '4px', color: '#1a1a1a', margin: 0 }}>{data.chairmanName || "Muhammad Farooq Ahmad"}</p>
                        <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '4px', color: '#94a3b8', margin: 0 }}>Chairman - SLS</p>
                    </div>
                </div>
            </div>

            {/* Verification Footer (Very Bottom) */}
            <div style={{ position: 'absolute', bottom: '36px', left: 0, width: '100%', textAlign: 'center', fontSize: '9px', fontWeight: '500', userSelect: 'none', pointerEvents: 'none', opacity: 0.6, color: '#94a3b8' }}>
                Verify Membership at: https://sls-uet.org/verify | Membership ID: {data.memberId?.member_id || "2025-SLS-UET.01"}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-up space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#002147]/5 flex items-center justify-center text-[#002147]">
                        <i className="fas fa-medal text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Certificates Hub</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">Generate and manage official society credentials</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-600' : 'bg-[#002147] text-white shadow-lg'}`}>
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`} />
                    {showForm ? 'Cancel Issuance' : 'Generate New Certificate'}
                </button>
            </div>

            {showForm && (
                <div className="max-w-3xl mx-auto animate-fade-up">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">
                                    {isBulkMode ? 'Bulk Issue Event Certificates' : 'Issue New Certificate'}
                                </h3>
                                <button
                                    onClick={() => { setIsBulkMode(!isBulkMode); setForm({ ...form, memberId: "", eventId: "" }); setSearchMember(""); }}
                                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Switch to {isBulkMode ? 'Single Issue' : 'Bulk Issue'}
                                </button>
                            </div>

                            {!isBulkMode && (
                                <div className="relative">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">1. Select Recipient Member</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name or member ID..."
                                        value={searchMember}
                                        onChange={(e) => setSearchMember(e.target.value)}
                                        className={inputCls}
                                    />
                                    {searchMember && !form.memberId && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {filteredMembers.map(m => (
                                                <button
                                                    key={m._id}
                                                    onClick={() => {
                                                        setForm({ ...form, memberId: m._id });
                                                        setSearchMember(m.name);
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center group"
                                                >
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#002147] transition-colors">{m.name}</span>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold group-hover:bg-[#002147]/10 group-hover:text-[#002147] transition-colors">{m.member_id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {form.memberId && (
                                        <div className="mt-2 flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-check-circle text-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-700">{selectedMember?.name} ({selectedMember?.member_id})</span>
                                            </div>
                                            <button onClick={() => { setForm({ ...form, memberId: "" }); setSearchMember(""); }} className="text-emerald-700 hover:text-emerald-900"><i className="fas fa-times" /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">2. Certificate Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => updateDefaultDescription(e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="Appreciation">Appreciation</option>
                                        <option value="Achievement">Achievement</option>
                                        <option value="Participation">Participation</option>
                                        <option value="Excellence">Excellence</option>
                                        <option value="Other">Other Category...</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        {isBulkMode ? '1. Select Event (Required)' : '3. Event (Optional)'}
                                    </label>
                                    <select
                                        value={form.eventId}
                                        onChange={(e) => {
                                            setForm({ ...form, eventId: e.target.value });
                                        }}
                                        className={inputCls}
                                    >
                                        <option value="">{isBulkMode ? 'Select an event...' : 'No Specific Event'}</option>
                                        {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                                    </select>
                                    {isBulkMode && form.eventId && (
                                        <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-info-circle text-blue-500" />
                                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                                                    {events.find(e => e._id === form.eventId)?.participants?.filter(p => p.attended).length || 0} Members Marked Present
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-bold text-blue-500 italic">Certificate target group filtered</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {form.category === 'Other' && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Provide Category Name</label>
                                    <input type="text" placeholder="e.g. Best Organizer 2026" value={form.customCategory} onChange={e => setForm({ ...form, customCategory: e.target.value })} className={inputCls} />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">4. Certificate Description</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className={inputCls}
                                    placeholder="Add certificate specific lines..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">5. Signature Name (Chairman)</label>
                                <input type="text" value={form.chairmanName} onChange={e => setForm({ ...form, chairmanName: e.target.value })} className={inputCls} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">6. Certificate Main Title</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. CERTIFICATE OF MEMBERSHIP" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">7. Award Type / Designation</label>
                                <input type="text" value={form.awardType} onChange={e => setForm({ ...form, awardType: e.target.value })} className={inputCls} placeholder="e.g. Official Membership" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowPreview(true)}
                                disabled={(!isBulkMode && !form.memberId) || (isBulkMode && !form.eventId) || submitting}
                                className="w-full sm:flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#002147] hover:text-[#002147] transition-all disabled:opacity-50"
                            >
                                <i className="fas fa-eye mr-2" />
                                Preview Draft
                            </button>
                            <button
                                onClick={isBulkMode ? handleBulkIssue : handleIssue}
                                disabled={(!isBulkMode && !form.memberId) || (isBulkMode && !form.eventId) || submitting}
                                className="w-full sm:flex-1 py-4 bg-[#002147] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-blue-900/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-check" />}
                                {isBulkMode ? 'Bulk Issue to All Participants' : 'Issue & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm relative mt-8">
                {selectedCertIds.length > 0 && (
                    <div className="fixed sm:absolute bottom-6 sm:bottom-auto sm:top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-5 sm:px-8 py-3 rounded-2xl sm:rounded-2xl shadow-2xl shadow-blue-900/40 flex flex-wrap items-center justify-center gap-4 sm:gap-6 animate-fade-up border border-slate-700 w-[90%] sm:w-auto ring-4 ring-slate-900/20 backdrop-blur-md">
                        <span className="text-[9px] sm:text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-xl uppercase tracking-widest whitespace-nowrap">{selectedCertIds.length} Selected</span>
                        <div className="hidden sm:block w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-5 sm:gap-6">
                            <button onClick={handleBulkDownload} disabled={isDownloading} className="text-blue-400 hover:text-blue-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                {isDownloading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-file-arrow-down" />} Download
                            </button>
                            <button onClick={handleBulkRevoke} disabled={isRevoking} className="text-rose-400 hover:text-rose-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                {isRevoking ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-alt" />} Revoke
                            </button>
                        </div>
                    </div>
                )}

                <div className="px-6 sm:px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">Issuance History</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Archive of verified awards</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Filter records..."
                                value={searchCert}
                                onChange={(e) => setSearchCert(e.target.value)}
                                className="w-full sm:w-56 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-0 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                            />
                        </div>
                        <button onClick={() => { setSelectMode(!selectMode); setSelectedCertIds([]); }} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectMode ? 'bg-[#002147] text-white border-[#002147] shadow-lg shadow-blue-900/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                            <i className="fas fa-layer-group mr-2" /> {selectMode ? "Done" : "Select"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-slate-400 italic text-sm">Loading history...</div>
                ) : (
                    <div className="p-4 sm:p-0">
                        <div className="sm:hidden space-y-2">
                            {issuedCertificates.filter(c =>
                                (c.memberId?.name || c.memberName || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.memberId?.member_id || c.member_id_str || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.eventId?.title || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.category || "").toLowerCase().includes(searchCert.toLowerCase())
                            ).length === 0 ? (
                                <div className="text-center py-20 text-slate-300 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                    <i className="fas fa-file-circle-exclamation text-4xl mb-3 block opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No matching history</p>
                                </div>
                            ) : issuedCertificates.filter(c =>
                                (c.memberId?.name || c.memberName || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.memberId?.member_id || c.member_id_str || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.eventId?.title || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                (c.category || "").toLowerCase().includes(searchCert.toLowerCase())
                            ).map((cert) => (
                                <div key={cert._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 relative overflow-hidden transition-all space-y-3">
                                    <div className="flex justify-between items-center gap-3">
                                        <div className={`flex items-center gap-2 ${selectMode ? 'ml-8' : ''}`}>
                                            {selectMode && (
                                                <div className="absolute top-3 left-3 z-10">
                                                    <input type="checkbox" checked={selectedCertIds.includes(cert._id)} onChange={() => toggleCertSelect(cert._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
                                                </div>
                                            )}
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <i className="fas fa-certificate text-[10px]" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-xs leading-none mb-1">{cert.memberId?.name || cert.memberName}</h4>
                                                <p className="text-[9px] font-bold text-[#002147] uppercase tracking-widest leading-none">{cert.memberId?.member_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end text-right">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(cert.createdAt).toLocaleDateString()}</span>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[8px] font-bold text-slate-600 mt-1 truncate max-w-[80px]">
                                                {cert.category === 'Other' ? cert.customCategory : cert.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1 border-t border-slate-50">
                                        <button onClick={() => downloadPDF(cert)} className="flex-1 bg-blue-50 text-blue-600 border border-blue-100 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all">
                                            <i className="fas fa-file-pdf" /> PDF
                                        </button>
                                        <button onClick={() => revokeCertificate(cert._id)} className="flex-1 bg-rose-50 text-rose-500 border border-rose-100 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-rose-500 hover:text-white transition-all">
                                            <i className="fas fa-trash-alt" /> Revoke
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        {selectMode && (
                                            <th className="px-8 py-5 w-10 text-center transition-all">
                                                <input type="checkbox" checked={selectedCertIds.length === issuedCertificates.length && issuedCertificates.length > 0} onChange={handleSelectAllCerts} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                            </th>
                                        )}
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Member</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Award Classification</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Official Occasion</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date Issued</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {issuedCertificates.filter(c =>
                                        (c.memberId?.name || c.memberName || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                        (c.memberId?.member_id || c.member_id_str || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                        (c.eventId?.title || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                        (c.category || "").toLowerCase().includes(searchCert.toLowerCase())
                                    ).length === 0 ? (
                                        <tr>
                                            <td colSpan={selectMode ? 6 : 5} className="py-20 text-center">
                                                <div className="opacity-10 mb-4"><i className="fas fa-medal text-5xl" /></div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No certificates matching query</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        issuedCertificates.filter(c =>
                                            (c.memberId?.name || c.memberName || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                            (c.memberId?.member_id || c.member_id_str || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                            (c.eventId?.title || "").toLowerCase().includes(searchCert.toLowerCase()) ||
                                            (c.category || "").toLowerCase().includes(searchCert.toLowerCase())
                                        ).map(cert => (
                                            <tr key={cert._id} className={`transition-all ${selectedCertIds.includes(cert._id) ? 'bg-[#002147]/5' : 'hover:bg-slate-50/30'}`}>
                                                {selectMode && (
                                                    <td className="px-8 py-6 text-center transition-all">
                                                        <input type="checkbox" checked={selectedCertIds.includes(cert._id)} onChange={() => toggleCertSelect(cert._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                                    </td>
                                                )}
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800 tracking-tight leading-none mb-1.5">{cert.memberId?.name || cert.memberName || "Deleted Member"}</span>
                                                        <span className="text-[10px] text-[#002147] font-black uppercase tracking-widest leading-none">
                                                            {cert.memberId?.member_id || cert.member_id_str || "N/A"}
                                                            {!cert.memberId && <span className="ml-2 text-rose-400 font-bold opacity-60">[HISTORICAL]</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-xs text-slate-600">
                                                    <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                                        {cert.category === 'Other' ? cert.customCategory : cert.category}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-400 italic">
                                                    {cert.eventId?.title || "Society Delegate"}
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                    {new Date(cert.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => downloadPDF(cert)} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Download Document">
                                                            <i className="fas fa-file-pdf text-xs" />
                                                        </button>
                                                        <button onClick={() => revokeCertificate(cert._id)} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Revoke Certificate">
                                                            <i className="fas fa-trash-alt text-xs" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />

                    <div className="relative bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[96vh] w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#002147]/5 flex items-center justify-center">
                                    <i className="fas fa-file-certificate text-[#002147] text-lg" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-[#002147] text-base font-black uppercase tracking-tight">Review Certificate Proof</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Final layout verification before official issuance</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center">
                                <i className="fas fa-times text-lg" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-8 sm:p-14 bg-slate-50/50 custom-scrollbar">
                            <div className="flex justify-center min-h-[1150px] w-full">
                                <div className="transform scale-[0.65] sm:scale-[0.8] lg:scale-[0.65] xl:scale-[0.75] origin-top h-fit shadow-[0_20px_50px_rgba(0,33,71,0.15)] ring-1 ring-slate-200 rounded-sm overflow-hidden">
                                    <div id="cert-template-preview">
                                        <CertificateTemplate
                                            data={{ ...form, memberId: selectedMember, eventId: selectedEvent }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                                <i className="fas fa-shield-check text-emerald-500" />
                                Prepared for generation
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => downloadPDF({ ...form, memberId: selectedMember, eventId: selectedEvent })}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-white hover:bg-slate-50 text-[#002147] border-2 border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-download" />
                                    Download Proof
                                </button>

                                <button
                                    onClick={() => { setShowPreview(false); isBulkMode ? handleBulkIssue() : handleIssue(); }}
                                    className="flex-1 sm:flex-none px-10 py-3.5 bg-[#002147] text-white hover:bg-slate-800 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <i className="fas fa-paper-plane" />
                                    {isBulkMode ? 'Bulk Issue Certificates' : 'Issue Official Certificate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '794px', height: '1123px', opacity: 0, pointerEvents: 'none', zIndex: -100, overflow: 'hidden' }}>
                {exportData && (
                    <div id="cert-export-node">
                        <CertificateTemplate data={exportData} />
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Dossier Static View ──────────────────────────────────
const DossierView = ({ memberId, members, onBack }) => {
    const member = members.find(m => m._id === memberId);
    if (!member) return <div className="p-10 text-center text-slate-400">Record not found.</div>;

    const calculateBatch = (dateStr) => {
        if (!dateStr) return new Date().getFullYear();
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth();
        return month >= 8 ? year : year - 1;
    };

    return (
        <div className="max-w-4xl mx-auto bg-white min-h-screen p-4 sm:p-10 md:p-12 lg:p-16 animate-fade-in shadow-2xl rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 mt-2 sm:mt-6 mb-20 overflow-hidden">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 border-b border-slate-100 pb-8 sm:pb-12">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-widest">
                    <i className="fas fa-arrow-left" /> Return
                </button>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <h2 className="text-xl sm:text-3xl font-black text-[#002147] uppercase italic tracking-tighter">Member Dossier</h2>
                    <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mt-1">Official Personnel Record</p>
                </div>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12 mb-12 sm:mb-16 text-center sm:text-left">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 text-white rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center text-3xl sm:text-5xl font-black shadow-2xl shrink-0">
                    {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">{member.name}</h1>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                        <span className="bg-slate-100 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black text-slate-600 uppercase tracking-widest border border-slate-200/50">#{member.member_id}</span>
                        <span className="bg-blue-50 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black text-[#002147] uppercase tracking-widest border border-blue-100/50">Batch {calculateBatch(member.createdAt)}</span>
                        <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest border ${member.status === 'blocked' ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'}`}>{member.status}</span>
                    </div>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 sm:gap-y-12 md:gap-x-16">
                {/* Personal Information */}
                <div className="space-y-6 sm:space-y-8">
                    <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-[0.4em] border-b border-slate-50 pb-3 sm:pb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.name}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Father's Name</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.father_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Email</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-all">{member.email}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.whatsapp || member.phone || 'N/A'}</p>
                        </div>
                        <div className="sm:col-span-2 md:col-span-1">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Residential Address</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed uppercase">{member.address ? `${member.address}, ${member.city || ''}` : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Academic Profile */}
                <div className="space-y-6 sm:space-y-8 pt-6 md:pt-0">
                    <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-[0.4em] border-b border-slate-50 pb-3 sm:pb-4">Academic Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Education Level</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.education_level || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Degree Program</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.program || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">University / Institution</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.university || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Passing Year</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.passing_year || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* System Record */}
                <div className="md:col-span-2 space-y-6 sm:space-y-8 pt-8">
                    <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-[0.4em] border-b border-slate-50 pb-3 sm:pb-4">System Record</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Role</p>
                            <p className="text-xs sm:text-sm font-bold text-[#002147] uppercase tracking-tighter">{member.role || 'General'}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">{member.status}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{new Date(member.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Internal Reference</p>
                            <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 truncate">{member._id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 sm:mt-24 pt-12 border-t border-slate-50 flex flex-col items-center opacity-60">
                <div className="w-12 h-0.5 sm:w-16 sm:h-1 bg-slate-900 mb-6" />
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">End of Official Document</p>
            </div>
        </div>
    );
};

// ── Settings Tab (SELF-MANAGEMENT) ───────────────────────

// ── Members Tab (Moved Outside to fix Search Strokes) ────────
const MembersTab = ({ members, fetchMembers, loading, search, setSearch, auth, notify, Spinner, adminUser, api, inputCls, page, setPage, totalPages }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);
    const [localSearch, setLocalSearch] = useState(search);

    const generalMembers = members.filter(m => m.role !== 'Admin' && m.role !== 'Superuser');

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? generalMembers.map(m => m._id) : []);
    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const deleteSingle = async (dbId, name) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE ${name}? This action cannot be undone.`)) return;
        setIsProcessing(true);
        try {
            await api.delete(`admin/members/${dbId}`, auth);
            notify("Member deleted successfully.");
            fetchMembers();
        }
        catch (err) { notify(err.response?.data?.error || "Delete failed", "error"); }
        finally { setIsProcessing(false); }
    };

    const toggleSuspend = async (memberDbId) => {
        try {
            const res = await api.patch(`admin/members/${memberDbId}/toggle-block`, {}, auth);
            fetchMembers();
            notify(res.data.message);
        } catch (err) {
            notify(err.response?.data?.error || "Failed to update member status", "error");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`CRITICAL: Permanently delete ${selectedIds.length} members?`)) return;
        setIsProcessing(true);
        try {
            await api.post("admin/members/bulk-delete", { ids: selectedIds }, auth);
            notify(`Successfully deleted ${selectedIds.length} members.`);
            fetchMembers();
            setSelectedIds([]);
        } catch (err) {
            notify("Bulk delete failed", "error");
        } finally { setIsProcessing(false); }
    };

    const triggerSearch = () => {
        setPage(1);
        setSearch(localSearch);
        fetchMembers();
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
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">{generalMembers.length} Approved Members</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${bulkMode ? 'bg-[#002147] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        <i className="fas fa-layer-group mr-2" /> {bulkMode ? "Done" : "Select"}
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input type="text" placeholder="Search members..." value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
                            className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-0  outline-none text-sm transition-all" />
                    </div>
                    <button onClick={triggerSearch} className="bg-[#002147] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm">
                        Search
                    </button>
                </div>
            </div>

            {loading ? <Spinner /> : (
                <>
                    <div className="sm:hidden space-y-2">
                        {generalMembers.length === 0 ? (
                            <div className="text-center py-20 text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                                <i className="fas fa-id-badge text-5xl mb-4 block opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No records matched</p>
                            </div>
                        ) : generalMembers.map((m) => (
                            <div key={m.member_id} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden transition-all">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#002147] text-white rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-md">
                                            {(m.name || "?").charAt(0)}
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
                                            <input type="checkbox" checked={selectedIds.length === generalMembers.length && generalMembers.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
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
                                    {generalMembers.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-20 text-slate-400">
                                            <i className="fas fa-id-badge text-5xl mb-4 block opacity-10" /> No records matched the query.
                                        </td></tr>
                                    ) : generalMembers.map((m) => (
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
                    </div>
                </>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <i className="fas fa-arrow-left mr-2" /> Prev
                    </button>

                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Next <i className="fas fa-arrow-right ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};


const AdminPortal = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "dashboard";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [stats, setStats] = useState(null);
    const [members, setMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [pendingMembers, setPendingMembers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [events, setEvents] = useState([]);
    const [toast, setToast] = useState(null);
    const [mobileNav, setMobileNav] = useState(false);
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [membersPage, setMembersPage] = useState(1);
    const [membersTotalPages, setMembersTotalPages] = useState(1);

    const token = localStorage.getItem("adminToken");
    const [adminUser, setAdminUser] = useState(localStorage.getItem("adminUser"));
    const isSuper = localStorage.getItem("adminIsSuper") === "1";
    const auth = useMemo(() => ({
        headers: { Authorization: `Bearer ${token}` }
    }), [token]);

    useEffect(() => {
        const restricted = ["admins", "customization", "logs"];
        if (restricted.includes(activeTab) && !isSuper) {
            setSearchParams({ tab: "dashboard" }); // use setSearchParams not setActiveTab
            return;
        }
        if (activeTab === "dashboard") fetchStats();
        if (activeTab === "members") fetchMembers();
        if (activeTab === "admins" ||
            activeTab === "certificates" ||
            activeTab === "batches") fetchAllMembers();
        if (activeTab === "pending") fetchPendingMembers();
        if (activeTab === "events" ||
            activeTab === "certificates") fetchEvents();
        if (activeTab === "announcements") fetchAnnouncements();
        if (activeTab === "certificates" ||
            activeTab === "batches") fetchCertificates();
    }, [activeTab, isSuper, fetchStats, fetchMembers, fetchAllMembers,
        fetchPendingMembers, fetchEvents, fetchAnnouncements, fetchCertificates, setSearchParams]);

    // Separate effect ONLY for pagination:
    useEffect(() => {
        if (activeTab === "members") fetchMembers();
    }, [membersPage]); // membersPage only — not activeTab

    // Back-Button Trap: Force the browser to stay on this page
    useEffect(() => {
        // Push a state so there's something to go back from
        window.history.pushState(null, null, window.location.pathname + window.location.search);

        const handlePopState = (e) => {
            // If they try to go back, force them forward again
            window.history.go(1);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const notify = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchStats = useCallback(async () => {
        try { const r = await api.get("admin/dashboard", auth); setStats(r.data); } catch { }
    }, [auth]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`admin/members?search=${search}&page=${membersPage}&limit=10`, auth);
            setMembers(r.data.members || []);
            setMembersTotalPages(r.data.totalPages || 1);
        }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [search, membersPage, auth]);

    const fetchAllMembers = useCallback(async () => {
        try {
            const r = await api.get(`admin/members?limit=1000`, auth);
            setAllMembers(r.data.members || []);
        } catch (err) {
            console.error("Fetch All Members Error:", err);
        }
    }, [auth]);

    const fetchPendingMembers = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get(`admin/pending-members`, auth); setPendingMembers(r.data); }
        catch { } finally { setLoading(false); }
    }, [auth]);

    const fetchEvents = useCallback(async () => {
        try { const r = await api.get("events/admin", auth); setEvents(r.data); } catch { }
    }, [auth]);

    const fetchAnnouncements = useCallback(async () => {
        try { const r = await api.get("announcements", auth); setAnnouncements(r.data); } catch { }
    }, [auth]);

    const fetchCertificates = useCallback(async () => {
        try {
            const r = await api.get("certificates/admin/all", auth);
            // Filter out certificates issued to Admins or Superusers
            const nonAdminCerts = r.data.filter(c => {
                const role = c.memberId?.role;
                return role && role !== 'Admin' && role !== 'Superuser';
            });
            setIssuedCertificates(nonAdminCerts);
        } catch { }
    }, [auth]);

    const logout = async () => {
        try {
            await api.post("admin/logout", {}, auth);
        } catch (err) {
            console.error("Admin logout error:", err);
        }
        localStorage.clear();
        navigate("/admin-login", { replace: true });
    };

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: "fa-th-large" },
        { id: "members", label: "Members", icon: "fa-users" },
        { id: "pending", label: "Pending", icon: "fa-user-clock" },
        { id: "events", label: "Events", icon: "fa-calendar-alt" },
        { id: "announcements", label: "Announcements", icon: "fa-bullhorn" },
        { id: "certificates", label: "Certificates", icon: "fa-medal" },
        { id: "batches", label: "Batches", icon: "fa-layer-group" },
    ];
    if (isSuper) {
        tabs.push({ id: "admins", label: "Manage Admins", icon: "fa-user-shield" });
        tabs.push({ id: "customization", label: "Customization", icon: "fa-screwdriver-wrench" });
        tabs.push({ id: "logs", label: "System Logs", icon: "fa-list-check" });
    }

    // ── Dashboard Tab ────────────────────────────────────────
    // ── Dashboard Tab (Moved Outside) ────────────────────
    const DashboardTab = ({ adminUser, setActiveTab, stats, isSuper, tabs, Spinner, StatCard }) => (
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
            {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard icon="fa-users" label="Total Members" value={stats.total_members} color="blue" />
                    <StatCard icon="fa-user-clock" label="Pending" value={stats.pending_members} color="indigo" />
                    {isSuper && <StatCard icon="fa-user-shield" label="Admins" value={stats.total_admins} color="sky" />}
                    <StatCard icon="fa-calendar-alt" label="Events" value={stats.total_events} color="violet" />
                </div>
            ) : <Spinner />}

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


    // ── Members Tab ──────────────────────────────────────────


    // ── Approvals Tab ──────────────────────────────────────────
    const DetailItem = ({ label, value, icon, fullWidth }) => (
        <div className={fullWidth ? "col-span-full" : "col-span-1"}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <i className={`fas ${icon} text-[#002147]/40`} /> {label}
            </label>
            <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                {value || "Not provided"}
            </p>
        </div>
    );

    const ApprovalsTab = ({ pendingMembers, fetchPendingMembers, loading, auth, notify, Spinner, api }) => {
        const [searchTerm, setSearchTerm] = useState("");
        const [selectedIds, setSelectedIds] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);
        const [bulkMode, setBulkMode] = useState(false);

        const [interviewTarget, setInterviewTarget] = useState(null);
        const [interviewForm, setInterviewForm] = useState({ venue: "SLS Society HQ, Campus Block B", message: "" });
        const [sendingCall, setSendingCall] = useState(false);
        const [viewMember, setViewMember] = useState(null);

        const filtered = (pendingMembers || []).filter(m =>
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.joining_year?.toString().includes(searchTerm)
        );

        const handleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(m => m._id) : []);
        const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

        const approveSingle = async (id) => {
            if (!window.confirm("Approve this member?")) return;
            setIsProcessing(true);
            try {
                const r = await api.post(`admin/approve-member/${id}`, {}, auth);
                notify(`Approved! Member ID: ${r.data.member_id}`);
                fetchPendingMembers();
            }
            catch (err) {
                notify("Failed to approve", "error");
                if (err.response?.data?.error?.toLowerCase().includes("already")) { fetchPendingMembers(); }
            } finally { setIsProcessing(false); }
        };

        const deleteSingle = async (id, name) => {
            if (!window.confirm(`Are you sure you want to delete ${name}'s application? This action cannot be undone.`)) return;
            setIsProcessing(true);
            try {
                await api.delete(`admin/members/${id}`, auth);
                notify("Application deleted successfully.");
                fetchPendingMembers();
            } catch (err) {
                notify(err.response?.data?.error || "Failed to delete application.", "error");
            } finally { setIsProcessing(false); }
        };

        const handleBulkApprove = async () => {
            if (!window.confirm(`Bulk approve ${selectedIds.length} applications?`)) return;
            setIsProcessing(true);
            let count = 0;
            await Promise.all(selectedIds.map(async id => {
                try { await api.post(`admin/approve-member/${id}`, {}, auth); count++; } catch { } // eslint-disable-line no-empty
            }));
            notify(`Approved ${count} members.`);
            fetchPendingMembers();
            setSelectedIds([]);
            setIsProcessing(false);
        };

        const handleBulkDelete = async () => {
            if (!window.confirm(`CRITICAL ACTION: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} applications?`)) return;
            setIsProcessing(true);
            try {
                await api.post("admin/members/bulk-delete", { ids: selectedIds }, auth);
                notify(`Successfully deleted ${selectedIds.length} applications.`);
                fetchPendingMembers();
                setSelectedIds([]);
            } catch (err) {
                notify("Bulk delete failed", "error");
            } finally { setIsProcessing(false); }
        };

        const handleInterviewCall = async (e) => {
            e.preventDefault();
            if (!interviewTarget) return;
            setSendingCall(true);
            try {
                await api.post(`admin/interview-call/${interviewTarget._id}`, interviewForm, auth);
                notify(`Interview call sent to ${interviewTarget.name}!`);
                setInterviewTarget(null);
                setInterviewForm({ venue: "SLS Society HQ, Campus Block B", message: "" });
                fetchPendingMembers();
            } catch (err) {
                notify(err.response?.data?.error || "Failed to send interview invitation", "error");
            } finally { setSendingCall(false); }
        };

        return (
            <div className="space-y-6 animate-fade-up relative">
                {selectedIds.length > 0 && (
                    <div className="fixed sm:absolute bottom-6 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[100] bg-slate-900 text-white px-5 sm:px-6 py-3 rounded-2xl sm:rounded-full shadow-2xl shadow-blue-900/40 flex flex-wrap items-center justify-center gap-4 animate-fade-up border border-slate-700 w-[90%] sm:w-auto ring-4 ring-slate-900/20 backdrop-blur-md">
                        <span className="text-[10px] sm:text-xs font-bold bg-white/10 px-3 py-1 rounded-xl sm:rounded-full whitespace-nowrap">{selectedIds.length} Selected</span>
                        <div className="hidden sm:block w-px h-4 bg-white/20" />
                        <button onClick={handleBulkApprove} disabled={isProcessing} className="text-emerald-400 hover:text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                            {isProcessing ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check-double" />} Approve
                        </button>
                        <div className="hidden sm:block w-px h-4 bg-white/20" />
                        <button onClick={handleBulkDelete} disabled={isProcessing} className="text-rose-400 hover:text-rose-300 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                            <i className="fas fa-trash-alt" /> Delete
                        </button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pending Approvals</h2>
                        <p className="text-slate-400 text-sm mt-1">{(pendingMembers || []).length} remaining in queue</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${bulkMode ? 'bg-[#002147] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <i className="fas fa-layer-group mr-2" /> {bulkMode ? "Done" : "Select"}
                        </button>
                        <div className="relative w-full sm:w-72">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input type="text" placeholder="Filter applicants..." value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 focus:ring-0  outline-none text-sm shadow-sm" />
                        </div>
                    </div>
                </div>

                {loading ? <Spinner /> : (
                    <>
                        <div className="sm:hidden space-y-2">
                            {filtered.length === 0 ? (
                                <div className="text-center py-20 text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                                    <i className="fas fa-check-circle text-4xl mb-3 block opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No pending members</p>
                                </div>
                            ) : filtered.map((m) => (
                                <div key={m._id} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden transition-all">
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-inner">
                                                {(m.name || "?").charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 leading-none mb-1 text-xs">{m.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Class {m.joining_year}</p>
                                            </div>
                                        </div>
                                        {m.interview_called ? (
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Called</span>
                                        ) : (
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Pending</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => setViewMember(m)}
                                            className="flex-1 text-[9px] bg-slate-50 text-slate-600 border border-slate-100 py-2 rounded-lg font-black uppercase tracking-widest transition-all hover:bg-slate-100">
                                            Details
                                        </button>
                                        <button onClick={() => setInterviewTarget(m)}
                                            className={`flex-1 text-[9px] py-2 rounded-lg font-black uppercase tracking-widest border transition-all ${m.interview_called ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                }`}>
                                            Interview
                                        </button>
                                        <button onClick={() => approveSingle(m._id)} disabled={isProcessing}
                                            className="flex-1 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 py-2 rounded-lg font-black uppercase tracking-widest disabled:opacity-50">
                                            Approve
                                        </button>
                                        <button onClick={() => deleteSingle(m._id, m.name)} disabled={isProcessing}
                                            className="w-10 text-[9px] bg-rose-50 text-rose-500 border border-rose-100 py-2 rounded-lg font-black flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white">
                                            <i className="fas fa-trash-alt" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden sm:block bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar-horizontal">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                            {bulkMode && (<th className="px-5 py-3.5 w-10 text-center transition-all">
                                                <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
                                            </th>)}
                                            <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Applicant Name</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Email Record</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest">Entry Year</th>
                                            <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-20 text-slate-400">
                                                <i className="fas fa-check-circle text-4xl mb-4 block text-emerald-300/50" />
                                                <p className="text-xs font-black uppercase tracking-widest">No pending members</p>
                                            </td></tr>
                                        ) : filtered.map((m) => (
                                            <tr key={m._id} className={`transition-colors group ${selectedIds.includes(m._id) ? 'bg-[#002147]/5' : 'hover:bg-amber-50/40'}`}>
                                                {bulkMode && (<td className="px-5 py-3.5 text-center transition-all">
                                                    <input type="checkbox" checked={selectedIds.includes(m._id)} onChange={() => toggleSelect(m._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147]" />
                                                </td>)}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-800 font-bold">{m.name}</span>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Applicant</span>
                                                            {m.interview_called ? (
                                                                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                                                    <i className="fas fa-check-circle text-xs" /> Called
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Not Called</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-500">{m.email}</td>
                                                <td className="px-5 py-3.5 font-bold text-slate-400 font-mono tracking-tighter">{m.joining_year}</td>
                                                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                                                    <button onClick={() => setViewMember(m)}
                                                        className="text-xs px-4 py-2 rounded-xl transition-all font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
                                                        <i className="fas fa-eye" /> Details
                                                    </button>
                                                    <button onClick={() => setInterviewTarget(m)}
                                                        className={`text-xs px-4 py-2 rounded-xl transition-all font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${m.interview_called
                                                            ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                                            : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                                            }`}>
                                                        <i className={m.interview_called ? "fas fa-sync-alt" : "fas fa-microphone-alt"} />
                                                        {m.interview_called ? "Call Again" : "Interview Call"}
                                                    </button>
                                                    <button onClick={() => approveSingle(m._id)} disabled={isProcessing}
                                                        className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors font-bold uppercase tracking-widest disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                                                        <i className="fas fa-check" /> Approve
                                                    </button>
                                                    <button onClick={() => deleteSingle(m._id, m.name)} disabled={isProcessing}
                                                        className="text-white bg-rose-500 w-10 h-10 rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center shadow-lg shadow-rose-900/20 active:scale-95 disabled:opacity-50" title="Delete Application">
                                                        <i className="fas fa-trash-alt" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {interviewTarget && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
                            <div className="bg-[#002147] p-8 text-white relative flex-shrink-0">
                                <button onClick={() => setInterviewTarget(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all transform hover:rotate-90">
                                    <i className="fas fa-times text-xl" />
                                </button>
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md border border-white/10">
                                    <i className="fas fa-calendar-check text-2xl" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">Schedule Interview Call</h3>
                                <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Recruitment Drive Invitation</p>
                            </div>

                            <form onSubmit={handleInterviewCall} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-[#002147] transition-colors">Interview Venue / Location</label>
                                    <div className="relative">
                                        <i className="fas fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#002147] transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={interviewForm.venue}
                                            onChange={e => setInterviewForm({ ...interviewForm, venue: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-0  outline-none transition-all"
                                            placeholder="e.g. Society HQ or Online Link"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-[#002147] transition-colors">Interview Description / Details</label>
                                    <textarea
                                        rows="4"
                                        required
                                        value={interviewForm.message}
                                        onChange={e => setInterviewForm({ ...interviewForm, message: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-0  outline-none transition-all resize-none shadow-sm"
                                        placeholder="Add schedule, instructions or requirements..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setInterviewTarget(null)}
                                        className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-100 shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingCall}
                                        className="px-6 py-4 bg-[#002147] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                    >
                                        {sendingCall ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
                                        {sendingCall ? "Sending..." : "Confirm & Send"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {viewMember && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={() => setViewMember(null)}>
                        <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-br from-[#002147] to-blue-900 p-8 md:p-10 text-white relative flex-shrink-0">
                                <button onClick={() => setViewMember(null)} className="absolute top-8 right-8 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
                                    <i className="fas fa-times" />
                                </button>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-3xl font-black border border-white/20 backdrop-blur-xl">
                                        {viewMember.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight leading-tight uppercase">{viewMember.name}</h3>
                                        <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.3em] mt-1">Full Applicant Profile</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DetailItem label="Full Name" value={viewMember.name} icon="fa-user" />
                                    <DetailItem label="Father Name" value={viewMember.father_name} icon="fa-user-friends" />
                                    <DetailItem label="Email Address" value={viewMember.email} icon="fa-envelope" />
                                    <DetailItem label="WhatsApp Number" value={viewMember.whatsapp} icon="fa-phone" />
                                    <DetailItem label="University" value={viewMember.university} icon="fa-university" />
                                    <DetailItem label="Degree Program" value={viewMember.program} icon="fa-graduation-cap" />
                                    <DetailItem label="Home City" value={viewMember.city} icon="fa-city" />
                                    <DetailItem label="Joining Year" value={viewMember.joining_year} icon="fa-calendar-check" />
                                    <DetailItem label="Passing Year" value={viewMember.passing_year} icon="fa-calendar-alt" />
                                </div>
                                <div className="pt-6 border-t border-slate-100">
                                    <DetailItem label="Current Address" value={viewMember.address} icon="fa-location-dot" fullWidth />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button onClick={() => setViewMember(null)} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
                                    Close Portal
                                </button>
                                <button onClick={() => { approveSingle(viewMember._id); setViewMember(null); }} className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20">
                                    Approve Member
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };



    // ── Events Tab ───────────────────────────────────────────
    // ── Events Tab (Moved Outside to fix Search Strokes) ────────
    const EventsTab = ({ events, fetchEvents, api, auth, notify, setSearchParams, getImgUrl, CountdownTimer, inputCls }) => {
        const [activeSubTab, setActiveSubTab] = useState("view");
        const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", location: "", is_active: true, time: "" });
        const [creating, setCreating] = useState(false);
        const [file, setFile] = useState(null);
        const [preview, setPreview] = useState(null);
        const [searchTerm, setSearchTerm] = useState("");
        const [statusFilter, setStatusFilter] = useState("All");
        const [selectedIds, setSelectedIds] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);
        const [bulkMode, setBulkMode] = useState(false);
        const ldt = new Date();
        const todayStr = `${ldt.getFullYear()}-${String(ldt.getMonth() + 1).padStart(2, '0')}-${String(ldt.getDate()).padStart(2, '0')}`;

        const filteredEvents = events.filter(e => {
            const matchSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.location?.toLowerCase().includes(searchTerm.toLowerCase());
            const endTimestamp = new Date(`${e.endDate || e.date}T23:59:59`).getTime();
            const hasEnded = Date.now() > endTimestamp;
            const matchStatus = statusFilter === "All" || (statusFilter === "Running" && !hasEnded) || (statusFilter === "Ended" && hasEnded);
            return matchSearch && matchStatus;
        });

        const handleSelectAll = (e) => setSelectedIds(e.target.checked ? filteredEvents.map(ev => ev._id) : []);
        const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

        const handleFileChange = (e) => {
            const selected = e.target.files[0];
            if (selected) {
                setFile(selected);
                setPreview(URL.createObjectURL(selected));
            }
        };

        const create = async (e) => {
            e.preventDefault();

            const now = new Date();
            const isToday = form.date === todayStr;

            if (!form.date) {
                notify("Please select a date", "error");
                return;
            }

            if (isToday && form.time) {
                try {
                    const eventStartTime = new Date(`${form.date}T${form.time}:00`);
                    if (!isNaN(eventStartTime.getTime()) && eventStartTime < now) {
                        notify("Selected time has already passed for today.", "error");
                        return;
                    }
                } catch (err) {
                    console.error("Date validation error:", e);
                }
            }

            if (form.date < todayStr) {
                notify("Event date cannot be in the past", "error");
                return;
            }

            if (form.endDate && form.endDate < form.date) {
                notify("The event cannot end before it starts.", "error");
                return;
            }

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
                fetchEvents();
                setActiveSubTab("view");
            } catch (err) { notify(err.response?.data?.error || "Failed to create", "error"); }
            finally { setCreating(false); }
        };

        const deleteSingle = async (id) => {
            if (!window.confirm("Delete event?")) return;
            setIsProcessing(true);
            try { await api.delete(`events/${id}`, auth); notify("Event deleted"); fetchEvents(); }
            catch { notify("Delete failed", "error"); }
            finally { setIsProcessing(false); }
        };

        const handleBulkDelete = async () => {
            if (!window.confirm(`Permanently remove ${selectedIds.length} event records?`)) return;
            setIsProcessing(true);
            let count = 0;
            await Promise.all(selectedIds.map(async id => {
                try { await api.delete(`events/${id}`, auth); count++; } catch (e) { }
            }));
            notify(`Removed ${count} out of ${selectedIds.length} events`);
            fetchEvents();
            setSelectedIds([]);
            setIsProcessing(false);
        };

        const viewParticipants = (event) => {
            setSearchParams({ tab: 'events', eventId: event._id });
        };


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
                    <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700" />
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-6 sm:mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-inner"><i className="fas fa-calendar-plus" /></div>
                            Create New Event
                        </h3>
                        <form onSubmit={create} className="space-y-8">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Event Title *</label>
                                    <input type="text" placeholder="Official Event Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Start Date *</label>
                                    <input type="date" min={todayStr} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} className={inputCls} required />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">End Date *</label>
                                    <input type="date" min={form.date || todayStr} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} required />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Starting Time</label>
                                    <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Physical Location</label>
                                    <input type="text" placeholder="e.g. Main Auditorium, UET" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Event Poster</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[#002147] hover:bg-white transition-all text-slate-400 text-xs font-black uppercase tracking-widest">
                                            <i className="fas fa-cloud-arrow-up text-sm" />
                                            {file ? file.name : "Select Asset"}
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                        {preview && (
                                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Event Description</label>
                                <textarea placeholder="Provide detailed event information..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="sr-only peer" />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                                    </label>
                                    <span className={`text-xs font-black uppercase tracking-widest ${form.is_active ? "text-emerald-600" : "text-slate-400"}`}>{form.is_active ? "Live Status" : "Standby Status"}</span>
                                </div>
                                <button type="submit" disabled={creating}
                                    className={`px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl ${creating ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#002147] text-white hover:bg-slate-800 shadow-blue-900/20 active:scale-95"}`}>
                                    {creating ? "Processing..." : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeSubTab === "view" && (
                    <div className="space-y-8 animate-fade-in relative">
                        {selectedIds.length > 0 && (
                            <div className="fixed sm:absolute bottom-6 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[100] bg-slate-900 text-white px-5 sm:px-6 py-3 rounded-2xl sm:rounded-full shadow-2xl shadow-blue-900/40 flex flex-wrap items-center justify-center gap-4 animate-fade-up border border-slate-700 w-[90%] sm:w-auto ring-4 ring-slate-900/20 backdrop-blur-md">
                                <span className="text-[10px] sm:text-xs font-bold bg-white/10 px-3 py-1 rounded-xl sm:rounded-full whitespace-nowrap">{selectedIds.length} Selected</span>
                                <div className="hidden sm:block w-px h-4 bg-white/20" />
                                <button onClick={handleBulkDelete} disabled={isProcessing} className="text-rose-400 hover:text-rose-300 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                    {isProcessing ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-alt" />} Delete Records
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Posts</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-800 uppercase">{events.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active / Running</p>
                                <p className="text-3xl font-black text-emerald-500 uppercase">
                                    {events.filter(e => Date.now() <= new Date(`${e.endDate || e.date}T23:59:59`).getTime()).length}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ended / Archive</p>
                                <p className="text-3xl font-black text-slate-300 uppercase">{events.filter(e => Date.now() > new Date(`${e.endDate || e.date}T23:59:59`).getTime()).length}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Event Registry</h3>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${bulkMode ? 'bg-[#002147] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    <i className="fas fa-layer-group mr-2" /> {bulkMode ? "Done" : "Select"}
                                </button>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600  outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all">
                                    <option value="All">All Statuses</option>
                                    <option value="Running">Running Active</option>
                                    <option value="Ended">Archive Ended</option>
                                </select>
                                <div className="relative w-full sm:w-64">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                    <input type="text" placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 text-sm shadow-sm outline-none  focus:ring-0" />
                                </div>
                            </div>
                        </div>

                        <div className="sm:hidden space-y-2">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                    <i className="fas fa-calendar-xmark text-4xl mb-4 block text-slate-100" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No events found</p>
                                </div>
                            ) : filteredEvents.map((ev) => {
                                const hasEnded = Date.now() > new Date(`${ev.endDate || ev.date}T23:59:59`).getTime();
                                return (
                                    <div key={ev._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative transition-all p-3 space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                    {ev.image_url ? (
                                                        <img src={getImgUrl(ev.image_url)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i className="fas fa-calendar-alt text-lg text-slate-200" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-xs leading-tight mb-1">{ev.title}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <i className="fas fa-users text-blue-500" /> {ev.participants?.length || 0} Joined
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${hasEnded ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                }`}>
                                                {hasEnded ? "Ended" : "Live"}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => viewParticipants(ev)} className="flex-1 bg-[#002147] text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                Participants
                                            </button>
                                            <button onClick={() => deleteSingle(ev._id)} className="w-10 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center border border-rose-100">
                                                <i className="fas fa-trash-alt" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="hidden sm:block bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                            {bulkMode && (<th className="px-8 py-5 w-10 text-center transition-all">
                                                <input type="checkbox" checked={selectedIds.length === filteredEvents.length && filteredEvents.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                            </th>)}
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Event Title</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Registrations</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredEvents.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-24 text-slate-300">
                                                <i className="fas fa-calendar-xmark text-5xl mb-4 block opacity-10" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No events found in registry.</p>
                                            </td></tr>
                                        ) : filteredEvents.map((ev) => {
                                            const d = ev.endDate || ev.date;
                                            const dateStr = d ? new Date(d).toISOString().split('T')[0] : "";
                                            const targetDate = `${dateStr}T${ev.time || "23:59"}:00`;

                                            return (
                                                <tr key={ev._id} className={`transition-colors group ${selectedIds.includes(ev._id) ? 'bg-[#002147]/5' : 'hover:bg-slate-50/50'}`}>
                                                    {bulkMode && (<td className="px-8 py-6 text-center transition-all">
                                                        <input type="checkbox" checked={selectedIds.includes(ev._id)} onChange={() => toggleSelect(ev._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                                    </td>)}
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            {ev.image_url && <img src={getImgUrl(ev.image_url)} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm" />}
                                                            <div>
                                                                <p className="font-black text-slate-800 leading-tight">{ev.title}</p>
                                                                <p className="text-xs text-slate-400 font-bold mt-0.5"><i className="fas fa-location-dot mr-1" />{ev.location || "TBA"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-bold text-slate-600">{new Date(ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(ev.endDate || ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                                        <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{ev.time || "TBA"}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <button onClick={() => viewParticipants(ev)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#002147] hover:text-white transition-all shadow-sm">
                                                            <i className="fas fa-users mr-2" />
                                                            {ev.participants?.length || 0} Registered
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <CountdownTimer targetDate={targetDate} />
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => deleteSingle(ev._id)} className="text-rose-400 hover:text-rose-600 p-3 hover:bg-rose-50 rounded-xl transition-all">
                                                            <i className="fas fa-trash-alt" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    // ── Participants Static View (Moved Outside) ──────────────
    const ParticipantsView = ({ eventId, events, onBack, auth, api, notify, fetchEvents }) => {
        const [participants, setParticipants] = useState([]);
        const [loading, setLoading] = useState(true);
        const [searchTerm, setSearchTerm] = useState("");
        const [selectedMemberIds, setSelectedMemberIds] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);

        const event = events.find(e => e._id === eventId);
        const eventName = event?.title || "Event Records";

        const loadParticipants = async () => {
            setLoading(true);
            try {
                const res = await api.get(`events/${eventId}/participants?limit=1000`, auth);
                // Filter out Admins and Superusers from attendance
                const nonAdminParticipants = res.data.filter(p => {
                    const role = p.memberId?.role;
                    return role !== 'Admin' && role !== 'Superuser';
                });
                setParticipants(nonAdminParticipants);
            } catch (err) {
                notify("Failed to load participants", "error");
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            loadParticipants();
        }, [eventId]);

        const handleToggleAttendance = async (memberId, currentStatus) => {
            try {
                const mIdStr = String(memberId);
                await api.patch(`events/${eventId}/attendance`, { memberId: mIdStr, attended: !currentStatus }, auth);

                setParticipants(prev => prev.map(p => {
                    const pMId = p.memberId?._id || p.memberId;
                    return String(pMId) === mIdStr ? { ...p, attended: !currentStatus } : p;
                }));

                fetchEvents();
                notify(`Status updated!`);
            } catch (err) {
                notify("Attendance update failed", "error");
            }
        };

        const handleBulkAttendance = async (status) => {
            const idsToUpdate = selectedMemberIds.length > 0 ? selectedMemberIds : null;
            const targetCount = idsToUpdate ? idsToUpdate.length : participants.length;

            if (!window.confirm(`Mark ${targetCount} selected as ${status ? 'PRESENT' : 'ABSENT'}?`)) return;

            setIsProcessing(true);
            try {
                await api.patch(`events/${eventId}/attendance/bulk`, { attended: status, ids: idsToUpdate }, auth);
                setParticipants(prev => prev.map(p => {
                    const pMId = p.memberId?._id || p.memberId;
                    if (!idsToUpdate || idsToUpdate.includes(String(pMId))) {
                        return { ...p, attended: status };
                    }
                    return p;
                }));
                fetchEvents();
                notify(`Updated ${targetCount} records!`);
                setSelectedMemberIds([]);
            } catch (err) {
                notify("Bulk action failed", "error");
            } finally {
                setIsProcessing(false);
            }
        };

        const filteredParticipants = participants.filter(p =>
            p.memberId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.memberId?.member_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const toggleMemberSelection = (id) => {
            const idStr = String(id);
            setSelectedMemberIds(prev => prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]);
        };

        return (
            <div className="max-w-6xl mx-auto bg-white min-h-screen p-4 sm:p-8 lg:p-12 animate-fade-in shadow-2xl rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 mt-2 sm:mt-6 mb-20 overflow-hidden">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-slate-50 pb-8 sm:pb-10">
                    <div className="space-y-4 w-full sm:w-auto">
                        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all text-[10px] sm:text-xs font-black uppercase tracking-widest group">
                            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform" /> Back to Registry
                        </button>
                        <div>
                            <h2 className="text-xl sm:text-3xl font-black text-[#002147] uppercase italic tracking-tighter leading-none">{eventName}</h2>
                            <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mt-2">Official Attendance & Participation Log</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {selectedMemberIds.length > 0 && (
                            <div className="flex gap-2 animate-fade-up">
                                <button onClick={() => handleBulkAttendance(false)} disabled={isProcessing} className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">
                                    Absent
                                </button>
                                <button onClick={() => handleBulkAttendance(true)} disabled={isProcessing} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                    Present
                                </button>
                            </div>
                        )}
                        <div className="relative flex-1 sm:w-64">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                            <input
                                type="text"
                                placeholder="Filter participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-32 text-center">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#002147] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Retrieving Registry...</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <i className="fas fa-user-slash text-slate-200 text-5xl mb-4" />
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No matching records found</p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {/* List Header - Hidden on Mobile */}
                        <div className="hidden sm:flex items-center px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                            <div className="w-10 flex justify-center">
                                <input
                                    type="checkbox"
                                    checked={selectedMemberIds.length === participants.length && participants.length > 0}
                                    onChange={() => {
                                        if (selectedMemberIds.length === participants.length) setSelectedMemberIds([]);
                                        else setSelectedMemberIds(participants.map(p => String(p.memberId?._id || p.memberId)));
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-[#002147] focus:ring-[#002147]"
                                />
                            </div>
                            <div className="flex-1 ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant Details</div>
                            <div className="w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</div>
                            <div className="w-40 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Attendance Status</div>
                        </div>

                        {filteredParticipants.map((p, idx) => {
                            const mId = p.memberId?._id || p.memberId;
                            const mIdStr = String(mId);
                            const isSelected = selectedMemberIds.includes(mIdStr);

                            return (
                                <div key={idx} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border transition-all duration-300 group hover:shadow-xl hover:shadow-slate-200/40 ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-lg shadow-blue-900/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                                        <div className="w-8 sm:w-10 flex justify-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleMemberSelection(mIdStr)}
                                                className="w-4 h-4 rounded border-slate-300 text-[#002147] focus:ring-[#002147] cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 sm:flex-none flex items-center gap-4 ml-2 sm:ml-4 min-w-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                {p.memberId?.name?.charAt(0) || "M"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 leading-none mb-1 text-sm sm:text-base truncate group-hover:text-[#002147] transition-colors">{p.memberId?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{p.memberId?.member_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto sm:ml-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                                        <div className="text-left sm:text-right sm:w-32">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registered</p>
                                            <p className="text-[10px] font-bold text-slate-700">{new Date(p.joinedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>

                                        <button
                                            onClick={() => handleToggleAttendance(mIdStr, p.attended)}
                                            className={`sm:w-36 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-2 ${p.attended
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-500 hover:text-emerald-600'
                                                }`}
                                        >
                                            {p.attended ? <i className="fas fa-check-circle" /> : <i className="fas fa-circle-notch opacity-20" />}
                                            {p.attended ? 'Present' : 'Mark Present'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-16 sm:mt-24 pt-12 border-t border-slate-50 flex flex-col items-center opacity-40">
                    <div className="w-12 h-0.5 sm:w-16 sm:h-1 bg-slate-900 mb-4" />
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">Security Verification: {participants.length} Active Participants</p>
                </div>
            </div>
        );
    };

    // ── Announcements Tab (Moved Outside) ────────────────────
    const AnnouncementsTab = ({ announcements, fetchAnnouncements, api, auth, notify, inputCls }) => {
        const [form, setForm] = useState({ title: "", content: "", type: "Info" });
        const [submitting, setSubmitting] = useState(false);
        const [searchTerm, setSearchTerm] = useState("");
        const [selectedIds, setSelectedIds] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);
        const [bulkMode, setBulkMode] = useState(false);

        const filtered = announcements.filter(a => a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || a.content?.toLowerCase().includes(searchTerm.toLowerCase()));

        const handleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(a => a._id) : []);
        const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

        const create = async (e) => {
            e.preventDefault(); setSubmitting(true);
            try {
                await api.post("announcements", form, auth);
                notify("Announcement published successfully!");
                setForm({ title: "", content: "", type: "Info" });
                fetchAnnouncements();
            } catch { notify("Failed to publish announcement", "error"); }
            finally { setSubmitting(false); }
        };

        const deleteSingle = async (id) => {
            if (!window.confirm("Permanently remove this announcement?")) return;
            setIsProcessing(true);
            try {
                await api.delete(`announcements/${id}`, auth);
                notify("Announcement removed");
                fetchAnnouncements();
            } catch { notify("Removal failed", "error"); }
            finally { setIsProcessing(false); }
        };

        const handleBulkDelete = async () => {
            if (!window.confirm(`Permanently remove ${selectedIds.length} announcements?`)) return;
            setIsProcessing(true);
            let count = 0;
            await Promise.all(selectedIds.map(async id => {
                try { await api.delete(`announcements/${id}`, auth); count++; } catch (e) { }
            }));
            notify(`Deleted ${count} announcements`);
            fetchAnnouncements();
            setSelectedIds([]);
            setIsProcessing(false);
        };

        return (
            <div className="space-y-10 animate-fade-up relative">
                {selectedIds.length > 0 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl shadow-blue-900/40 flex items-center gap-4 animate-fade-up border border-slate-700">
                        <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">{selectedIds.length} Selected</span>
                        <div className="w-px h-4 bg-white/20" />
                        <button onClick={handleBulkDelete} disabled={isProcessing} className="text-rose-400 hover:text-rose-300 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                            {isProcessing ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash-alt" />} Delete Postings
                        </button>
                    </div>
                )}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-700" />
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                            <i className="fas fa-bullhorn" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Society Broadcast</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Draft a new official announcement</p>
                        </div>
                    </div>

                    <form onSubmit={create} className="space-y-6">
                        <div className="grid sm:grid-cols-3 gap-5">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Broadcast Title *</label>
                                <input type="text" placeholder="e.g. Annual Symposium 2026 Registration" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputCls} !py-4`} required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Priority Channel</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputCls} !py-4 bg-white`}>
                                    <option value="Info">General Info</option>
                                    <option value="Urgent">Urgent / Critical</option>
                                    <option value="Success">Achievement</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Detailed Message Content</label>
                            <textarea placeholder="Type your announcement content here..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className={`${inputCls} resize-none !py-4`} required />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={submitting}
                                className={`w-full sm:w-auto px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${submitting ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-[#002147] shadow-xl shadow-indigo-900/10 active:scale-[0.98]"
                                    }`}>
                                {submitting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
                                {submitting ? "BROADCASTING..." : "RELEASE UPDATE"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100/50 overflow-hidden">
                    <div className="p-6 sm:p-10 border-b border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 pl-1">Historical Archive</p>
                                <h4 className="text-2xl font-black text-slate-800 tracking-tight">System Broadcasts</h4>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-1 sm:w-72">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                    <input type="text" placeholder="Search broadcasts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-indigo-500 outline-none transition-all" />
                                </div>
                                <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
                                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${bulkMode ? 'bg-[#002147] text-white border-[#002147]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}>
                                    {bulkMode ? "CANCEL" : "SELECT RECORDS"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-10">
                        <div className="sm:hidden space-y-2">
                            {filtered.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                    <i className="fas fa-comment-slash text-4xl mb-4 block text-slate-100" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Archive is empty</p>
                                </div>
                            ) : filtered.map((ann) => (
                                <div key={ann._id} className="relative group overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm transition-all space-y-2 p-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${ann.type === 'Urgent' ? 'bg-rose-500 text-white' :
                                                    ann.type === 'Success' ? 'bg-emerald-500 text-white' :
                                                        'bg-[#002147] text-white'
                                                    }`}>
                                                    {ann.type}
                                                </span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-xs leading-none mb-1.5">{ann.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1 italic">"{ann.content}"</p>
                                        </div>
                                        <button onClick={() => deleteSingle(ann._id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shrink-0">
                                            <i className="fas fa-trash-alt text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden sm:block overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                        {bulkMode && (<th className="px-8 py-5 w-10 text-center transition-all">
                                            <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                        </th>)}
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Broadcast Details</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Message Preview</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Release Date</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-20 text-slate-300">
                                            <i className="fas fa-comment-slash text-4xl mb-3 block opacity-20" />
                                            <p className="text-xs font-black uppercase tracking-widest">No history recorded yet</p>
                                        </td></tr>
                                    ) : filtered.map((ann) => (
                                        <tr key={ann._id} className={`transition-colors ${selectedIds.includes(ann._id) ? 'bg-[#002147]/5' : 'hover:bg-slate-50/50'}`}>
                                            {bulkMode && (<td className="px-8 py-6 text-center transition-all">
                                                <input type="checkbox" checked={selectedIds.includes(ann._id)} onChange={() => toggleSelect(ann._id)} className="w-4 h-4 text-[#002147] border-slate-300 rounded focus:ring-[#002147] cursor-pointer" />
                                            </td>)}
                                            <td className="px-8 py-6">
                                                <p className="font-black text-slate-800 leading-tight mb-2">{ann.title}</p>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm ${ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600' :
                                                    ann.type === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>{ann.type}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 max-w-sm">
                                                    <p className="text-slate-500 font-medium line-clamp-2 text-xs italic">"{ann.content}"</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">{new Date(ann.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => deleteSingle(ann._id)} className="text-rose-400 hover:text-rose-600 p-3 hover:bg-rose-50 rounded-xl transition-all">
                                                    <i className="fas fa-trash-alt" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── System Logs Tab (SUPERUSER ONLY) ────────────────────────
    // ── System Logs Tab (Moved Outside) ────────────────────────
    const LogsTab = ({ api, auth, notify, isSuper }) => {
        const [logs, setLogs] = useState([]);
        const [loadingLogs, setLoadingLogs] = useState(false);
        const [page, setPage] = useState(1);
        const [totalPages, setTotalPages] = useState(1);

        const fetchLogs = async (p = 1) => {
            setLoadingLogs(true);
            try {
                const r = await api.get(`admin/logs?page=${p}&limit=50`, auth);
                setLogs(r.data.logs || []);
                setTotalPages(r.data.totalPages || 1);
                setPage(r.data.currentPage || 1);
            } catch (err) {
                notify("Failed to load logs", "error");
            } finally {
                setLoadingLogs(false);
            }
        };
        const handleExport = async () => {
            try {
                const r = await api.get('admin/logs/export', { ...auth, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([r.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'system_history_logs.csv');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                notify("Export successful", "success");
            } catch (err) {
                notify("Failed to export logs", "error");
            }
        };

        const handleBackup = async () => {
            try {
                const r = await api.get('admin/backup', { ...auth, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([r.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                notify("Full database backup successful", "success");
            } catch (err) {
                notify("Failed to backup database", "error");
            }
        };

        useEffect(() => {
            fetchLogs(1);
        }, []);

        return (
            <div className="space-y-6 animate-fade-up">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#002147]/10 text-[#002147] flex items-center justify-center">
                                    <i className="fas fa-clipboard-list" />
                                </div>
                                System Activity Logs
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Permanent record of all management actions taken</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleExport} className="hidden sm:flex px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#002147] rounded-lg transition-colors items-center gap-2 shadow-sm">
                                <i className="fas fa-file-export text-[#002147]" />
                                Export CSV
                            </button>
                            {isSuper && (
                                <button onClick={handleBackup} className="hidden sm:flex px-4 py-2 text-xs font-bold text-white bg-[#002147] hover:bg-[#002147]/90 rounded-lg transition-colors items-center gap-2 shadow-sm">
                                    <i className="fas fa-database" />
                                    Full Backup (JSON)
                                </button>
                            )}
                            <button onClick={() => fetchLogs(page)} className="text-slate-400 hover:text-[#002147] transition-colors p-2 bg-slate-50 border border-slate-100 hover:bg-blue-50 rounded-lg shadow-sm">
                                <i className={`fas fa-sync-alt ${loadingLogs ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-1 sm:p-0">
                        <div className="sm:hidden space-y-2 px-4 py-2">
                            {logs.length === 0 && !loadingLogs ? (
                                <div className="text-center py-16 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <i className="fas fa-inbox text-4xl mb-3 opacity-20 block text-slate-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No system logs recorded yet.</p>
                                </div>
                            ) : logs.map((log) => {
                                const actionText = log.action || '';
                                return (
                                    <div key={log._id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 relative overflow-hidden space-y-2">
                                        <div className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-xs font-black uppercase shrink-0 border border-slate-100">
                                                    {log.admin_name?.charAt(0) || <i className="fas fa-robot text-slate-400" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-xs leading-none mb-1 text-wrap">
                                                        {log.admin_name || "System/Unknown"}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md shrink-0 text-center ${actionText.includes('LOGIN') ? 'bg-blue-50 text-blue-600' :
                                                actionText.includes('CREATE') || actionText.includes('APPROVE') || actionText.includes('Add') ? 'bg-emerald-50 text-emerald-600' :
                                                    actionText.includes('BLOCK') || actionText.includes('DELETE') ? 'bg-rose-50 text-rose-600' :
                                                        'bg-slate-50 text-slate-600'
                                                }`}>
                                                {actionText}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50/50 px-2.5 py-2 rounded-xl text-[10px] text-slate-600 font-medium">
                                            {log.details}
                                            {log.target_id && (
                                                <span className="block mt-1 text-[#002147] font-bold text-[8px] uppercase tracking-widest leading-none">ID: {log.target_id.name || log.target_id.email || log.target_id._id || log.target_id}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Administrator</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.length === 0 && !loadingLogs && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                <i className="fas fa-inbox text-4xl mb-3 block opacity-20" />
                                                No system logs recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                    {logs.map((log) => {
                                        const actionText = log.action || '';
                                        return (
                                            <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                                                            {log.admin_name?.charAt(0) || <i className="fas fa-robot text-slate-400" />}
                                                        </div>
                                                        <span className="font-bold text-slate-800 text-xs">
                                                            {log.admin_name || "System/Unknown"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${actionText.includes('LOGIN') ? 'bg-blue-100 text-blue-700' :
                                                        actionText.includes('CREATE') || actionText.includes('APPROVE') || actionText.includes('Add') ? 'bg-emerald-100 text-emerald-700' :
                                                            actionText.includes('BLOCK') || actionText.includes('DELETE') ? 'bg-rose-100 text-rose-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {actionText}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                                    {log.details}
                                                    {log.target_id && (
                                                        <span className="ml-1 text-[#002147] font-bold mt-1 inline-block">ID: {log.target_id.name || log.target_id.email || log.target_id._id || log.target_id}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                            <button
                                disabled={page === 1}
                                onClick={() => fetchLogs(page - 1)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-xs font-bold text-slate-500">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => fetchLogs(page + 1)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // ── Settings Tab (SELF-MANAGEMENT) ───────────────────────

    // ── Settings Tab (Moved Outside) ────────────────────
    const SettingsTab = ({ adminUser, api, auth, notify, logout, setAdminUser, inputCls }) => {
        const [profile, setProfile] = useState({ name: adminUser, oldPassword: "", newPassword: "", confirmPassword: "" });
        const [updating, setUpdating] = useState(false);

        const handleUpdate = async (e) => {
            e.preventDefault();
            if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
                return notify("New passwords do not match", "error");
            }
            setUpdating(true);
            try {
                const r = await api.put("admin/profile", {
                    name: profile.name,
                    oldPassword: profile.oldPassword,
                    newPassword: profile.newPassword
                }, auth);

                notify(r.data.message);
                localStorage.setItem("adminUser", r.data.name);
                setAdminUser(r.data.name);
                setProfile({ ...profile, oldPassword: "", newPassword: "", confirmPassword: "" });
            } catch (err) {
                notify(err.response?.data?.error || "Profile update failed", "error");
            } finally {
                setUpdating(false);
            }
        };

        return (
            <div className="max-w-2xl mx-auto animate-fade-up">
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#002147] to-blue-500" />

                    <div className="p-6 md:p-12">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sm:mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#002147] text-lg sm:text-xl shadow-inner">
                                    <i className="fas fa-user-edit" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Security & Profile</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Self-Management Console</p>
                                </div>
                            </div>
                            <button type="button" onClick={logout} className="group flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 shadow-sm active:scale-95">
                                <i className="fas fa-power-off text-xs group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Display Name</label>
                                    <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={inputCls} required />
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5">
                                    <p className="text-xs font-black text-[#002147] uppercase tracking-widest flex items-center gap-2">
                                        <i className="fas fa-lock" /> Security Update
                                    </p>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 block">Current Password (Required)</label>
                                        <input type="password" placeholder="••••••••" value={profile.oldPassword} onChange={e => setProfile({ ...profile, oldPassword: e.target.value })} className={inputCls} required />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 block">New Password</label>
                                            <input type="password" placeholder="Leave blank to keep current" value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1.5 block">Confirm New</label>
                                            <input type="password" placeholder="••••••••" value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} className={inputCls} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={updating}
                                className="w-full bg-[#002147] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 disabled:opacity-50">
                                {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-save" />}
                                SAVE
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        );
    };


    // ── Admins Tab (Moved Outside to fix Search Strokes) ────────
    const AdminsTab = ({ members, adminUser, auth, notify, fetchMembers, inputCls, isSuper, api }) => {
        const [form, setForm] = useState({ name: "", email: "", password: "", joining_year: new Date().getFullYear(), member_id: "", role: "Admin" });
        const [submitting, setSubmitting] = useState(false);
        const [editing, setEditing] = useState(null);
        const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
        const adminList = members.filter(m => m.role === "Admin");

        const create = async (e) => {
            e.preventDefault(); setSubmitting(true);
            try {
                await api.post("admin/members/add/", form, auth);
                notify(`Admin account ${form.member_id} created!`);
                setForm({ name: "", email: "", password: "", joining_year: new Date().getFullYear(), member_id: "", role: "Admin" });
                fetchMembers();
            } catch (err) { notify(err.response?.data?.error || "Failed to create admin", "error"); }
            finally { setSubmitting(false); }
        };

        const del = async (id, name) => {
            if (!window.confirm(`Delete admin ${name}? This action is irreversible.`)) return;
            try {
                await api.delete(`admin/members/${id}`, auth);
                notify(`Admin ${name} deleted`);
                fetchMembers();
            }
            catch (err) { notify(err.response?.data?.error || "Delete failed", "error"); }
        };

        const toggleBlock = async (id) => {
            try {
                const r = await api.patch(`admin/members/${id}/toggle-block`, {}, auth);
                notify(r.data.message);
                fetchMembers();
            } catch (err) {
                notify(err.response?.data?.error || "Failed to toggle block", "error");
            }
        };

        const updateAdmin = async (e) => {
            e.preventDefault();
            try {
                await api.put(`admin/members/${editing}/update`, editForm, auth);
                notify(`Admin updated successfully`);
                setEditing(null);
                fetchMembers();
            } catch (err) {
                notify(err.response?.data?.error || "Update failed", "error");
            }
        };

        return (
            <div className="space-y-6 animate-fade-up relative">
                <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm shadow-inner"><i className="fas fa-user-plus" /></div>
                        Official Registration
                    </h3>
                    <form onSubmit={create} className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Full Name *</label>
                                <input type="text" placeholder="Admin Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Member ID / Username *</label>
                                <input type="text" placeholder="e.g. admin-hr" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} className={inputCls} required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email Address *</label>
                                <input type="email" placeholder="admin@sls.edu.pk" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Assign Password *</label>
                                <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Joining Year *</label>
                                <input type="number" value={form.joining_year} onChange={e => setForm({ ...form, joining_year: e.target.value })} className={inputCls} required />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-2">
                            <div className="flex items-center gap-2 text-slate-400 group">
                                <i className="fas fa-info-circle text-xs" />
                                <p className="text-xs font-bold uppercase tracking-widest leading-none">Account Role: <span className="text-indigo-600">Administrator</span></p>
                            </div>
                            <button type="submit" disabled={submitting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${submitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300 hover:-translate-y-0.5"}`}>
                                {submitting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-shield-halved" />}
                                Register Admin
                            </button>
                        </div>
                    </form>
                </div>

                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative animate-zoom-in">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#002147]" />
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-[#002147] uppercase tracking-tight">Edit Administrator</h3>
                                    <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <i className="fas fa-times text-lg" />
                                    </button>
                                </div>
                                <form onSubmit={updateAdmin} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Display Name</label>
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">Email Address (Unique)</label>
                                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5 block">New Password (Override)</label>
                                        <input type="password" placeholder="Leave blank to keep current" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setEditing(null)} className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all">Cancel</button>
                                        <button type="submit" className="flex-1 px-6 py-3.5 rounded-2xl bg-[#002147] text-white font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/20">Update Account</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <i className="fas fa-users-gear text-slate-400" /> Official Personnel
                    </h2>

                    <div className="sm:hidden space-y-2">
                        {adminList.filter(m => m.role !== 'Superuser' || isSuper).map((m) => (
                            <div key={m.member_id} className={`p-3 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all space-y-3 ${m.status === 'blocked' ? "opacity-75" : ""}`}>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            <span className="font-bold text-[10px] uppercase">{(m.name || "?").charAt(0)}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-xs leading-none mb-1">{m.name}</h4>
                                            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">{m.member_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end text-right">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${m.status === 'blocked' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                            {m.status === 'blocked' ? "Blocked" : "Active"}
                                        </span>
                                        <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-1">{m.role}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1 border-t border-slate-50">
                                    {m.member_id !== adminUser ? (
                                        <>
                                            <button onClick={() => toggleBlock(m._id)}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${m.status === 'blocked' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white"}`}>
                                                {m.status === 'blocked' ? "Unblock" : "Block"}
                                            </button>
                                            <button onClick={() => { setEditing(m.member_id); setEditForm({ name: m.name, email: m.email, password: "" }); }}
                                                className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-[#002147] hover:text-white transition-all">
                                                Edit
                                            </button>
                                            <button onClick={() => del(m._id, m.name)}
                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                <i className="fas fa-trash-alt text-[10px]" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full text-center py-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 opacity-50 bg-blue-50/50 rounded-lg">Account Owner</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">ID/Username</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Privilege Level</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {adminList.filter(m => m.role !== 'Superuser' || isSuper).map((m) => (
                                    <tr key={m.member_id} className={`hover:bg-purple-50/40 transition-colors group text-left ${m.status === 'blocked' ? "opacity-60 bg-slate-50/10" : ""}`}>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-800 font-bold">{m.member_id}</td>
                                        <td className="px-6 py-4 text-slate-800 font-bold">{m.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-purple-100 text-purple-700">
                                                {m.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${m.status === 'blocked' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                {m.status === 'blocked' ? "Blocked" : "Active"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {m.member_id !== adminUser ? (
                                                    <>
                                                        <button onClick={() => toggleBlock(m._id)}
                                                            className={`text-[9px] font-black uppercase tracking-widest border px-3 py-2 rounded-lg transition-all ${m.status === 'blocked' ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"}`}>
                                                            {m.status === 'blocked' ? "Unblock" : "Block"}
                                                        </button>
                                                        <button onClick={() => { setEditing(m.member_id); setEditForm({ name: m.name, email: m.email, password: "" }); }}
                                                            className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => del(m._id, m.name)}
                                                            className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all">
                                                            <i className="fas fa-trash-alt" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 bg-blue-50 px-4 py-1.5 rounded-full">Owner</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-900 max-w-full overflow-x-hidden">

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#002147] flex flex-col shadow-2xl transition-transform duration-500 ease-in-out ${mobileNav ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                {/* Logo Section (Premium Upgrade) */}
                <div className="p-6">
                    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-300" onClick={() => navigate("/")}>
                        <img src={logo} alt="SLS Logo" className="h-14 object-contain" />
                    </div>
                    <div className="mt-4 text-center px-2">
                        <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Command Portal</p>
                    </div>
                </div>

                {/* Nav Items (Cleaned & Higher Contrast) */}
                <nav className="flex-1 px-4 py-2 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2 pb-6">
                        {tabs.map((t) => (
                            <button key={t.id} onClick={() => { setActiveTab(t.id); setMobileNav(false); }}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group ${activeTab === t.id
                                    ? "bg-white text-[#002147] shadow-lg shadow-black/20"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === t.id ? "bg-[#002147]/5" : "bg-white/5 group-hover:bg-white/10"}`}>
                                    <i className={`fas ${t.icon} ${activeTab === t.id ? "text-[#002147]" : "text-white/40 group-hover:text-white"}`} />
                                </div>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </nav>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                `}} />

            </aside>

            {/* Mobile backdrop */}
            {mobileNav && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileNav(false)} />}

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <button className="lg:hidden text-slate-500 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100" onClick={() => setMobileNav(!mobileNav)}>
                            <i className={`fas ${mobileNav ? "fa-times" : "fa-bars"} text-base`} />
                        </button>
                        <div>
                            <h1 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-[0.2em]">{tabs.find(t => t.id === activeTab)?.label}</h1>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest hidden sm:block">Logistics Command</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={() => setActiveTab("settings")}
                            className="text-xs font-bold text-slate-500 hover:text-[#002147] w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 hover:bg-slate-50 rounded-xl flex items-center justify-center sm:justify-start gap-2 transition-all border border-transparent hover:border-slate-100">
                            <i className="fas fa-cog text-[14px] sm:text-xs" /> <span className="hidden sm:inline">Settings</span>
                        </button>
                    </div>
                </header>

                {/* Content Area Area */}
                <div className="flex-1 p-4 sm:p-8 lg:p-10">
                    {/* Notifications */}
                    {toast && (
                        <div className={`mb-8 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3 border animate-fade-down shadow-sm ${toast.type === "error"
                            ? "bg-rose-50 border-rose-100 text-rose-700"
                            : "bg-emerald-50 border-emerald-100 text-emerald-700"
                            }`}>
                            <i className={`fas ${toast.type === "error" ? "fa-circle-xmark" : "fa-circle-check"}`} />
                            {toast.text}
                        </div>
                    )}

                    {activeTab === "dashboard" && <DashboardTab adminUser={adminUser} setActiveTab={setActiveTab} stats={stats} isSuper={isSuper} tabs={tabs} Spinner={Spinner} StatCard={StatCard} />}
                    {activeTab === "members" && (
                        <MembersTab
                            members={members}
                            fetchMembers={fetchMembers}
                            loading={loading}
                            search={search}
                            setSearch={setSearch}
                            auth={auth}
                            notify={notify}
                            Spinner={Spinner}
                            adminUser={adminUser}
                            api={api}
                            inputCls={inputCls}
                            page={membersPage}
                            setPage={setMembersPage}
                            totalPages={membersTotalPages}
                        />
                    )}
                    {activeTab === "pending" && <ApprovalsTab pendingMembers={pendingMembers} fetchPendingMembers={fetchPendingMembers} loading={loading} auth={auth} notify={notify} Spinner={Spinner} api={api} />}
                    {activeTab === "events" && !searchParams.get("eventId") && <EventsTab events={events} fetchEvents={fetchEvents} api={api} auth={auth} notify={notify} setSearchParams={setSearchParams} getImgUrl={getImgUrl} CountdownTimer={CountdownTimer} inputCls={inputCls} />}
                    {activeTab === "events" && searchParams.get("eventId") && (
                        <ParticipantsView
                            eventId={searchParams.get("eventId")}
                            events={events}
                            onBack={() => setSearchParams({ tab: 'events' })}
                            auth={auth}
                            api={api}
                            notify={notify}
                            fetchEvents={fetchEvents}
                        />
                    )}
                    {activeTab === "announcements" && <AnnouncementsTab announcements={announcements} fetchAnnouncements={fetchAnnouncements} api={api} auth={auth} notify={notify} inputCls={inputCls} />}
                    {activeTab === "certificates" && <CertificatesTab auth={auth} notify={notify} api={api} members={allMembers} events={events} />}
                    {activeTab === "batches" && !searchParams.get("dossier") && <BatchesTab members={allMembers} issuedCertificates={issuedCertificates} auth={auth} api={api} notify={notify} setSearchParams={setSearchParams} />}
                    {activeTab === "batches" && searchParams.get("dossier") && <DossierView memberId={searchParams.get("dossier")} members={allMembers} onBack={() => setSearchParams({ tab: 'batches' })} />}
                    {isSuper && activeTab === "customization" && <CustomizationTabComponent auth={auth} notify={notify} getImgUrl={getImgUrl} inputCls={inputCls} api={api} members={allMembers} />}
                    {activeTab === "settings" && <SettingsTab adminUser={adminUser} api={api} auth={auth} notify={notify} logout={logout} setAdminUser={setAdminUser} inputCls={inputCls} />}
                    {isSuper && activeTab === "admins" && <AdminsTab members={allMembers} adminUser={adminUser} auth={auth} notify={notify} fetchMembers={fetchAllMembers} inputCls={inputCls} isSuper={isSuper} api={api} />}
                    {isSuper && activeTab === "logs" && <LogsTab api={api} auth={auth} notify={notify} isSuper={isSuper} />}
                </div>
            </main>
        </div>
    );
}

export default AdminPortal;
