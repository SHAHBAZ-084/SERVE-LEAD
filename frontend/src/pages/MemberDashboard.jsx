import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getImgUrl } from "../api";
import { Template1, Template2, Template3, logo, sealImg } from "./CertTemplates";
import CountdownTimer from "../components/common/CountdownTimer";
const Spinner = () => (
    <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" style={{ borderWidth: "3px" }} />
    </div>
);
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ── Shared Primitives ─────────────────────────────────────
const inputCls =
    "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-0 focus:bg-white focus:outline-none transition-all duration-200 text-sm shadow-sm placeholder:text-slate-300";

/** Counts up from 0 → target with easeOutQuart easing */
function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        const end = Number(target);
        if (!end || isNaN(end)) { setCount(0); return; }
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4); // easeOutQuart
            setCount(Math.floor(ease * end));
            if (p < 1) raf.current = requestAnimationFrame(tick);
            else setCount(end);
        };
        raf.current = requestAnimationFrame(tick);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [target, duration]);
    return count;
}

const StatCard = ({ icon, label, value, color }) => {
    const p = {
        blue: { bg: "from-[#002147] to-[#003366]", shadow: "shadow-blue-900/20", glow: "bg-blue-400" },
        indigo: { bg: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-900/20", glow: "bg-indigo-300" },
        sky: { bg: "from-sky-500 to-blue-600", shadow: "shadow-sky-900/20", glow: "bg-sky-300" },
        emerald: { bg: "from-emerald-500 to-teal-700", shadow: "shadow-emerald-900/20", glow: "bg-emerald-300" },
    };
    const c = p[color] || p.blue;
    const rawStr = String(value ?? "0");
    const numeric = parseInt(rawStr, 10) || 0;
    const suffix = rawStr.replace(/^\d+/, "");
    const animated = useCountUp(numeric);
    
    return (
        <div className={`relative bg-gradient-to-br ${c.bg} rounded-[2rem] p-6 text-white shadow-2xl ${c.shadow} overflow-hidden group hover:-translate-y-2 transition-all duration-500`}>
            {/* Live Pulse Glow */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${c.glow} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-700`} />
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-110 transition-transform duration-500">
                        <i className={`fas ${icon} text-xl animate-float`} />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Live</span>
                    </div>
                </div>
                
                <p className="text-4xl font-black tabular-nums leading-none tracking-tight mb-2">
                    {value == null ? "—" : `${animated}${suffix}`}
                </p>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">{label}</p>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

// ─────────────────────────────────────────
// CERTIFICATE TEMPLATES — defined OUTSIDE component
// ─────────────────────────────────────────



const MemberDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "dashboard";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [certificates, setCertificates] = useState([]);
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: "", email: "", id: "", dbId: "", role: "General Member", rawRole: "General", year: "20XX" });
    const [profileForm, setProfileForm] = useState({ name: "", email: "", password: "" });
    const [profileMsg, setProfileMsg] = useState(null);
    const [mobileNav, setMobileNav] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [joining, setJoining] = useState(false);

    const navigate = useNavigate();

    const auth = useMemo(() => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }), []);

    const handleLogout = useCallback(async () => {
        try {
            await api.post("auth/logout");
        } catch (err) {
            console.error("Logout error:", err);
        }
        localStorage.clear();
        navigate("/", { replace: true });
    }, [navigate]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const certRes = await api.get("certificates/member/me", auth);
            setCertificates(certRes.data);
            const eventRes = await api.get("events", auth);
            setEvents(eventRes.data);
            const annRes = await api.get("announcements", auth);
            setAnnouncements(annRes.data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    }, [auth]);

    // Back-Button Trap: Force the browser to stay on this page
    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname + window.location.search);
        const handlePopState = (e) => {
            window.history.go(1);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await api.get("auth/me", auth);
                const member = res.data;
                setUser({
                    name: member.name,
                    email: member.email,
                    id: member.member_id || "Awaiting Approval",
                    dbId: member._id,
                    role: `${member.role} Member`,
                    rawRole: member.role,
                    year: member.joining_year || "20XX",
                    status: member.status,
                    interview_called: member.interview_called
                });
                if (member.status === "pending") setLoading(false);
                else fetchAllData();
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 404) handleLogout();
                setLoading(false);
            }
        };
        fetchStatus();
    }, [navigate, fetchAllData, handleLogout, auth]);

    const [exportData, setExportData] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [certAssets, setCertAssets] = useState({ logo: null, seal: null, signature: null, stamp: null });

    useEffect(() => {
        const loadToDataURL = async (url, key) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setCertAssets(prev => ({ ...prev, [key]: reader.result }));
                reader.readAsDataURL(blob);
            } catch (err) {
                console.error(`Failed to load ${key} as Base64:`, err);
            }
        };
        loadToDataURL(logo, 'logo');
        loadToDataURL(sealImg, 'seal');
        loadToDataURL('/signature.png', 'signature');
        loadToDataURL('/stamp.png', 'stamp');
    }, []);

    const handleProfileUpdate = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            await api.put("auth/profile", profileForm, auth);
            alert("Profile updated successfully!");
            setProfileForm(prev => ({ ...prev, password: "" }));
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update profile");
        }
    };

    const handleJoinEvent = async (eventId) => {
        setJoining(true);
        try {
            const res = await api.post(`events/${eventId}/join`, {}, auth);
            alert(res.data.message || "Successfully joined!");
            fetchAllData(); // Refresh list to show 'Joined' status
        } catch (err) {
            alert(err.response?.data?.error || "Failed to join event");
        } finally {
            setJoining(false);
        }
    };

    const downloadPDF = async (certData) => {
        setExportData(certData);
        setExporting(true);
        
        // Give React time to re-render the unified node with new data
        await new Promise(r => setTimeout(r, 600));

        try {
            const activeTemplateId = Number(certData.templateId || 1);
            const isLandscape = true; // All templates (1, 2, 3) are now Landscape
            const W = 1123;
            const H = 794;

            // 1. Create a hidden iframe sandbox
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = `${W}px`;
            iframe.style.height = `${H}px`;
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.style.zIndex = '-1000';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // 2. Inject barebones HTML
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

            await new Promise(r => setTimeout(r, 1000));
            await iframeDoc.fonts.ready;

            // 3. Clone the unified node
            const sourceElement = document.getElementById('cert-export-node');
            if (!sourceElement) throw new Error("Export engine not found in DOM");

            const clonedNode = sourceElement.cloneNode(true);
            clonedNode.style.opacity = '1';
            clonedNode.style.visibility = 'visible';
            clonedNode.style.display = 'block';
            clonedNode.style.position = 'static';
            clonedNode.style.transform = 'none';
            clonedNode.style.left = 'auto';
            clonedNode.style.top = 'auto';

            iframeDoc.getElementById('sandbox-root').appendChild(clonedNode);

            // 4. Capture
            const canvas = await html2canvas(clonedNode, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: W,
                windowHeight: H
            });

            // 5. Generate PDF
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pdfW = isLandscape ? 297 : 210;
            const pdfH = isLandscape ? 210 : 297;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
            pdf.save(`SLS_Certificate_${certData.memberId?.name?.replace(/\s+/g, '_') || 'Award'}.pdf`);

            document.body.removeChild(iframe);
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert(`PDF Error: ${err.message}`);
        } finally {
            setExporting(false);
            setExportData(null);
        }
    };

    // --- SUB-VIEWS ---

    const renderDashboard = () => {
        const joinedEventsCount = events.filter(e => e.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId)).length;
        const upcomingEventsCount = events.filter(e => Date.now() <= new Date(`${e.endDate || e.date}T23:59:59`).getTime()).length;

        return (
            <div className="animate-fade-up space-y-8">
                {/* Modern Welcome Banner (Professional Weight) */}
                <div className="relative p-8 sm:p-12 rounded-3xl sm:rounded-[3.5rem] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
                    <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#002147]/5 blur-[80px] sm:blur-[120px] -mr-32 -mt-32 sm:-mr-48 sm:-mt-48 transition-transform duration-1000" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight text-shadow-sm">
                                    Welcome back, <span className="text-[#002147]">{user.name === "System Admin" ? "Member" : user.name}</span> <span className="inline-block animate-bounce shadow-xl">👋</span>
                                </h2>
                                {user.rawRole === 'Executive' ? (
                                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm flex items-center gap-2">
                                        <i className="fas fa-crown text-[10px]" /> Executive Member
                                    </span>
                                ) : (
                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm flex items-center gap-2">
                                        <i className="fas fa-user text-[10px]" /> General Member
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.4em] mt-2 sm:mt-3">SLS Society Member Portal</p>
                        </div>
                        <div className="flex -space-x-3 sm:-space-x-4">
                            {["S", "L", "S", "+"].map((char, i) => (
                                <div key={i} className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-white bg-slate-50 flex items-center justify-center text-[9px] sm:text-[11px] font-bold text-[#002147] shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all cursor-default">
                                    {char}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Statistics Grid (Professional Icons & Weights) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                    <StatCard icon="fa-medal" label="Certificates Earned" value={certificates.length} color="emerald" />
                    <StatCard icon="fa-calendar-check" label="Events Joined" value={joinedEventsCount} color="sky" />
                    <StatCard icon="fa-bullhorn" label="New Updates" value={announcements.length} color="indigo" />
                    <StatCard icon="fa-calendar-day" label="Upcoming Events" value={upcomingEventsCount} color="blue" />
                </div>

                {/* Direct Action Hub (Vibrant Unique Styling) */}
                {/* Direct Action Hub (Sleek Professional Redesign) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-6">
                    <button onClick={() => setActiveTab("events")} className="group relative flex items-center gap-6 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-violet-200 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-violet-600 group-hover:w-3 transition-all duration-500" />
                        <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            <i className="fas fa-calendar-star" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-violet-700 transition-colors">Explore Events</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover:text-slate-500 transition-colors">Browse Upcoming Programs</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-violet-50 group-hover:text-violet-400 transition-all">
                            <i className="fas fa-chevron-right text-xs" />
                        </div>
                    </button>

                    <button onClick={() => setActiveTab("certificates")} className="group relative flex items-center gap-6 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-amber-200 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 group-hover:w-3 transition-all duration-500" />
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-inner">
                            <i className="fas fa-award-simple" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-amber-700 transition-colors">My Portfolio</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover:text-slate-500 transition-colors">Access Your Credentials</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-400 transition-all">
                            <i className="fas fa-chevron-right text-xs" />
                        </div>
                    </button>

                    <button onClick={() => setActiveTab("announcements")} className="group relative flex items-center gap-6 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-rose-200 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 group-hover:w-3 transition-all duration-500" />
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-inner">
                            <i className="fas fa-bullhorn" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-rose-700 transition-colors">Society News</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover:text-slate-500 transition-colors">Stay Updated with Updates</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-400 transition-all">
                            <i className="fas fa-chevron-right text-xs" />
                        </div>
                    </button>

                    <button onClick={() => setActiveTab("letters")} className="group relative flex items-center gap-6 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#002147] group-hover:w-3 transition-all duration-500" />
                        <div className="w-16 h-16 bg-blue-50 text-[#002147] rounded-3xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-[#002147] group-hover:text-white transition-all duration-500 shadow-inner">
                            <i className="fas fa-file-signature" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">Official Letters</h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover:text-slate-500 transition-colors">Verification & Reference</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400 transition-all">
                            <i className="fas fa-chevron-right text-xs" />
                        </div>
                    </button>
                </div>

                {/* Joined Events Table */}
                <div className="mt-12 bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#002147] to-blue-500" />
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#002147]/10 text-[#002147] rounded-2xl flex items-center justify-center text-xl shadow-inner border border-[#002147]/10">
                                <i className="fas fa-calendar-check" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">My Participations</h3>
                                <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">Events you have joined</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-1 sm:p-0">
                        {/* Mobile Participation Card List */}
                        <div className="sm:hidden space-y-2">
                            {events.filter(e => e.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId)).length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <i className="fas fa-ghost text-3xl mb-3 opacity-20 block text-slate-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No events joined yet.</p>
                                </div>
                            ) : events.filter(e => e.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId)).map(event => {
                                const earnedCert = certificates.find(cert => cert.eventId?._id === event._id || cert.eventId === event._id);
                                return (
                                    <div key={event._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden p-3 flex flex-col gap-2">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <i className="fas fa-calendar-alt text-[10px]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-xs leading-none mb-1.5">{event.title}</h4>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                        {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • {event.location || "TBA"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 pt-0.5">
                                                {earnedCert ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-100 whitespace-nowrap">
                                                        <i className="fas fa-medal" /> Earned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                                                        <i className="fas fa-hourglass-half" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="pb-4 pt-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Event Title</th>
                                        <th className="pb-4 pt-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="pb-4 pt-2 font-black text-[10px] uppercase tracking-widest text-slate-400">Venue</th>
                                        <th className="pb-4 pt-2 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Certificate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {events.filter(e => e.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId)).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400">
                                                <i className="fas fa-ghost text-3xl mb-3 opacity-20 block" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">No events joined yet.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        events.filter(e => e.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId)).map(event => {
                                            const earnedCert = certificates.find(cert => cert.eventId?._id === event._id || cert.eventId === event._id);
                                            return (
                                                <tr key={event._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-5 pr-4">
                                                        <p className="font-bold text-slate-800 group-hover:text-[#002147] transition-colors">{event.title}</p>
                                                    </td>
                                                    <td className="py-5 pr-4 text-xs font-bold text-slate-500">
                                                        {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-5 pr-4 text-xs font-medium text-slate-500">
                                                        {event.location || "TBA"}
                                                    </td>
                                                    <td className="py-5 text-right">
                                                        {earnedCert ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                                <i className="fas fa-medal" /> Earned
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                                                                <i className="fas fa-hourglass-half" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCertificates = () => (
        <div className="animate-fade-up space-y-6">

            {certificates.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-certificate text-slate-200 text-3xl" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No certificates issued yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                        <div key={cert._id} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-1 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002147]/5 blur-3xl -mr-16 -mt-16" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className="text-[10px] font-bold tracking-widest bg-[#002147] text-white px-3 py-1 rounded-lg uppercase">
                                    {cert.category === 'Other' ? cert.customCategory : cert.category}
                                </span>
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase">
                                    <i className="fas fa-circle-check" /> Verified
                                </div>
                            </div>
                            <h3 className="font-bold text-2xl text-slate-800 mb-2 leading-tight">
                                {cert.eventId?.title || "Society Award"}
                            </h3>
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Awarded: {new Date(cert.createdAt).toLocaleDateString()}
                                </p>
                                <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-md uppercase border border-slate-100">
                                    Template {cert.templateId || 1}
                                </span>
                            </div>

                            <button
                                onClick={() => downloadPDF(cert)}
                                disabled={exporting}
                                className="w-full bg-[#002147] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                            >
                                {exporting && exportData?._id === cert._id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <i className="fas fa-cloud-arrow-down" />
                                )}
                                {exporting && exportData?._id === cert._id ? "Processing..." : "Retrieve Document"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Unified Certificate Engine (Export Node) */}
            <div 
                id="cert-export-node" 
                style={{ 
                    position: 'fixed', 
                    top: '-9999px',
                    left: '-9999px',
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: -1000
                }}
            >
                {(() => {
                    const tid = Number(exportData?.templateId || 1);
                    if (tid === 1) return <Template1 data={exportData || {}} certAssets={certAssets} id="actual-node" />;
                    if (tid === 2) return <Template2 data={exportData || {}} certAssets={certAssets} id="actual-node" />;
                    return <Template3 data={exportData || {}} certAssets={certAssets} id="actual-node" />;
                })()}
            </div>
        </div>
    );



    const renderEvents = () => (
        <div className="animate-fade-up space-y-8">


            {events.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                            <i className="fas fa-calendar-circle-exclamation text-4xl" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">No scheduled events at this time</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {events.map((event, index) => {
                        const d = event.endDate || event.date;
                        const dateStr = d ? new Date(d).toISOString().split('T')[0] : "";
                        const targetDate = `${dateStr}T${event.time || "23:59"}:00`;

                        const hasEnded = Date.now() > new Date(targetDate).getTime();
                        const isJoined = event.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId);

                        return (
                            <div key={index} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500 group relative flex flex-col min-w-0">
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={getImgUrl(event.image_url)}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                    {/* Date Badge */}
                                    <div className="absolute top-6 left-6 backdrop-blur-md bg-white/90 px-4 py-3 rounded-2xl shadow-2xl border border-white/50 text-center min-w-[64px]">
                                        <p className="text-xl font-bold text-[#002147] leading-none">
                                            {new Date(event.date).getDate()}
                                        </p>
                                        <p className="text-[9px] font-bold text-[#002147]/60 uppercase tracking-widest mt-1">
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-6 right-6">
                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-xl border backdrop-blur-md ${hasEnded ? "bg-slate-900/80 text-slate-300 border-white/10" : "bg-emerald-500/90 text-white border-emerald-400/30"
                                            }`}>
                                            {hasEnded ? "Event Ended" : "Upcoming Event"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <i className="fas fa-location-dot text-[#002147] text-xs" />
                                        {event.location || "Society Venue"}
                                    </div>

                                    <h3 className="font-bold text-2xl text-slate-800 mb-4 group-hover:text-[#002147] transition-colors leading-tight break-words">
                                        {event.title}
                                    </h3>

                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-3 break-words">
                                        {event.description?.substring(0, 160)}...
                                    </p>

                                    {/* Minimal Inline Countdown */}
                                    <div className="mb-6 flex items-center justify-between py-3 border-y border-slate-50">
                                        <CountdownTimer targetDate={targetDate} />
                                        {Date.now() < new Date(targetDate).getTime() && (
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Live
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex gap-4">
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                                        >
                                            View Details
                                        </button>

                                        {!hasEnded && (
                                            <button
                                                disabled={isJoined || joining}
                                                onClick={() => handleJoinEvent(event._id)}
                                                className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl ${isJoined
                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-900/5 cursor-default"
                                                        : "bg-[#002147] text-white hover:bg-slate-800 shadow-blue-900/20"
                                                    }`}
                                            >
                                                {joining ? "Registering..." : isJoined ? "Registered" : "Register Now"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Event Details Modal (Single Surface, Seamless Scroll) */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto pt-8 md:pt-24 pb-12">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/20 relative flex flex-col h-fit overflow-hidden">
                        <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all z-20 border border-white/20">
                            <i className="fas fa-times" />
                        </button>

                        <div className="h-64 sm:h-72 overflow-hidden flex-shrink-0 relative">
                            <img src={getImgUrl(selectedEvent.image_url)} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />
                        </div>

                        <div className="p-6 sm:p-10 flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-4 py-2 bg-[#002147] text-white text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20">Official Event</span>
                                {Date.now() > new Date(`${selectedEvent.endDate || selectedEvent.date}T23:59:59`).getTime() && (
                                    <span className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold uppercase tracking-widest rounded-xl">Event Ended</span>
                                )}
                            </div>

                            <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight leading-tight">{selectedEvent.title}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100/50">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#002147] shrink-0"><i className="fas fa-calendar" /></div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Timing</p>
                                        <p className="text-xs font-bold text-slate-700">{new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at {selectedEvent.time || "TBA"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100/50">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#002147] shrink-0"><i className="fas fa-location-dot" /></div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Venue</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedEvent.location || "TBA"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-slate prose-sm max-w-none">
                                <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedEvent.description}</p>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button onClick={() => setSelectedEvent(null)} className="px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Dismiss</button>
                            {!(Date.now() > new Date(`${selectedEvent.endDate || selectedEvent.date}T23:59:59`).getTime()) && !selectedEvent.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId) && (
                                <button
                                    onClick={() => handleJoinEvent(selectedEvent._id)}
                                    className="px-10 py-4 bg-[#002147] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-105 transition-all"
                                >
                                    Confirm Registration
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAnnouncements = () => (
        <div className="animate-fade-up space-y-10">
            {announcements.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3.5rem] border border-dashed border-slate-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                            <i className="fas fa-bell-slash text-5xl" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.4em]">Registry is currently at standby</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {announcements.map((ann, idx) => (
                        <div key={idx} className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-2 ${ann.type === 'Urgent' ? 'bg-rose-500' :
                                    ann.type === 'Success' ? 'bg-emerald-500' : 'bg-[#002147]'
                                }`} />

                            <div className="flex items-center justify-between mb-10">
                                <span className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm border ${ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        ann.type === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-[#002147] border-slate-100'
                                    }`}>
                                    {ann.type} Notice
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <i className="far fa-calendar-alt text-[#002147]/30" />
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-3xl font-bold text-slate-800 mb-6 group-hover:text-[#002147] transition-colors leading-tight tracking-tight">
                                {ann.title}
                            </h3>
                            <p className="text-slate-600 font-medium leading-relaxed mb-8 whitespace-pre-wrap text-[15px]">
                                {ann.content}
                            </p>

                            <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                                <div className="w-10 h-10 rounded-2xl bg-[#002147]/5 flex items-center justify-center text-[#002147] text-sm shadow-inner group-hover:bg-[#002147] group-hover:text-white transition-all duration-500">
                                    <i className="fas fa-shield-check" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Official Update</p>
                                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Security Clearance ID: {ann._id?.toString().slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const generateLetter = (type) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        const memberName = user.name;
        const memberId = user.id;

        // --- Header Section ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Date: ${today}`, pageWidth - 20, 20, { align: "right" });

        doc.setFontSize(18);
        doc.setTextColor(0, 33, 71); // SLS Navy Blue
        let title = "";
        if (type === 'verification') title = "MEMBERSHIP VERIFICATION LETTER";
        else if (type === 'reference') title = "REFERENCE LETTER";
        else if (type === 'recommendation') title = "RECOMMENDATION LETTER";
        
        doc.text(title, pageWidth / 2, 45, { align: "center" });

        // --- Salutation ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("To Whom It May Concern,", 20, 65);

        // --- Body Text ---
        doc.setFont("helvetica", "normal");
        const bodyY = 80;
        const lineSpacing = 8;
        let lines = [];

        if (type === 'verification') {
            lines = [
                `This document serves as official verification that Mr./Ms. ${memberName} is currently an active member in good standing of the Serve and Lead Society (SLS) as of ${today}.`,
                "",
                `His/Her membership remains valid and active. The member is entitled to all rights and privileges accorded under the bylaws and regulations of the Serve and Lead Society.`,
                "",
                `This verification is issued upon institutional request to confirm the authenticity of his/her membership status with SLS. For reference purposes, the membership ID is ${memberId}.`,
                "",
                "The membership is active as of today."
            ];
        } else if (type === 'reference') {
            lines = [
                `This is to confirm that Mr./Ms. ${memberName}, holding Membership ID: ${memberId}, is an active member in good standing of the Serve and Lead Society (SLS).`,
                "",
                `He/She has been associated with the organization and continues to serve as an active member. His/her membership is valid for the current session.`,
                "",
                `Throughout his/her ongoing association with SLS, Mr./Ms. ${memberName} has demonstrated a strong commitment to the organization's mission of promoting leadership, social awareness, and community service across Pakistan.`,
                "",
                `This letter is issued as a matter of reference to verify his/her ongoing and verified membership with the organization.`
            ];
        } else if (type === 'recommendation') {
            lines = [
                `It is with great pleasure that I recommend Mr./Ms. ${memberName} for his/her exemplary performance and dedication as a member of Serve and Lead Society (SLS).`,
                "",
                `He/She has been an active member and has consistently demonstrated his/her commitment to our organization's mission of promoting leadership, professional development, and social welfare.`,
                "",
                `During his/her tenure, he/she has shown exceptional qualities of leadership, integrity, and dedication to public service. He/she has actively participated in our programs and contributed significantly to our initiatives.`,
                "",
                `Mr./Ms. ${memberName} has demonstrated strong analytical skills, a keen understanding of collaborative principles, and a genuine commitment to social justice. His/her contributions have been particularly noteworthy.`,
                "",
                `I am confident that Mr./Ms. ${memberName} will continue to excel in all his/her future endeavors and will be a valuable asset to any organization or institution.`
            ];
        }

        let currentY = bodyY;
        lines.forEach(line => {
            if (line === "") {
                currentY += 4;
            } else {
                const wrappedLines = doc.splitTextToSize(line, pageWidth - 40);
                doc.text(wrappedLines, 20, currentY);
                currentY += (wrappedLines.length * 6) + 4;
            }
        });

        // --- Closing ---
        doc.setFont("helvetica", "bold");
        doc.text("Yours sincerely,", 20, currentY + 15);
        doc.setFont("helvetica", "normal");
        doc.text("Administration Department", 20, currentY + 23);
        doc.text("Serve and Lead Society (SLS)", 20, currentY + 29);

        doc.save(`${type}_letter_${memberId}.pdf`);
    };

    const renderLetters = () => (
        <div className="animate-fade-up space-y-10">
            <div className="relative p-10 sm:p-12 rounded-[3rem] overflow-hidden border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Official Letters</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">Verified Documentation & Credentials</p>
                    </div>
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-2xl shadow-inner border border-indigo-100">
                        <i className="fas fa-file-invoice" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { id: 'verification', title: 'Membership Verification', icon: 'fa-shield-check', desc: 'Confirm your status as an active verified member of SLS.' },
                    { id: 'reference', title: 'Reference Letter', icon: 'fa-user-check', desc: 'Formal document verifying your association and service history.' },
                    { id: 'recommendation', title: 'Recommendation', icon: 'fa-star-shooting', desc: 'Endorsement letter highlighting your leadership and performance.' }
                ].map((letter) => (
                    <div key={letter.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:bg-[#002147] group-hover:text-white transition-all duration-500 shadow-inner">
                            <i className={`fas ${letter.icon}`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-[#002147] transition-colors">{letter.title}</h3>
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-8 flex-1">{letter.desc}</p>
                        <button 
                            onClick={() => generateLetter(letter.id)}
                            className="w-full bg-[#002147] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <i className="fas fa-download text-xs" /> Download PDF
                        </button>
                    </div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                <i className="fas fa-circle-info text-amber-500 mt-1" />
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-loose">
                    These letters are generated based on your verified profile data. If you notice any discrepancies in your Name or Member ID, please update your profile in the settings tab before downloading.
                </p>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="animate-fade-up max-w-2xl space-y-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <i className="fas fa-cog text-[#002147]" /> Settings
            </h2>

            {profileMsg && (
                <div className={`p-5 rounded-2xl mb-6 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <i className={profileMsg.type === 'success' ? "fas fa-check-circle" : "fas fa-triangle-exclamation"} />
                    {profileMsg.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Profile Form */}
                <form onSubmit={handleProfileUpdate} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold text-[#002147] uppercase tracking-[0.2em]">Profile Credentials</p>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleLogout} className="group flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-all border border-rose-100 shadow-sm active:scale-95">
                                <i className="fas fa-power-off text-[10px] group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Logout</span>
                            </button>
                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner hidden sm:flex">
                                <i className="fas fa-shield-halved text-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Full Legal Name</label>
                            <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Registered Email</label>
                            <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Update Password (Optional)</label>
                            <input type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} className={inputCls} placeholder="Leave blank to maintain current" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-[#002147] text-white py-4 mt-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/20">
                        SAVE
                    </button>
                </form>

            </div>
        </div>
    );

    // --- MAIN RENDER ---

    if (status === "pending" || user.status === "pending") {
        const isInterviewed = user.interview_called;
        return (
            <>
                <Navbar />
                <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden max-w-xl w-full border border-slate-100 relative text-center">
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isInterviewed ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-500'}`} />
                        <div className="p-12">
                            <div className={`w-24 h-24 ${isInterviewed ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'} rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner`}>
                                <i className={`fas ${isInterviewed ? 'fa-calendar-check' : 'fa-id-card-clip'} text-4xl animate-pulse`}></i>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight uppercase">
                                {isInterviewed ? "Interview Scheduled" : "Approval Pending"}
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
                                {isInterviewed
                                    ? "Great news! You have been shortlisted for an interview. Please check your registered Gmail for the venue and time details sent by our administration."
                                    : "Welcome to the society. Your membership details are currently being verified by our administration team. You will receive an email confirmation once your access is ready."
                                }
                            </p>
                            <button onClick={handleLogout} className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.3em] hover:text-rose-600 transition-all flex items-center gap-2 mx-auto justify-center">
                                <i className="fas fa-power-off" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large' },
        { id: 'events', label: 'Society Events', icon: 'fa-calendar-alt' },
        { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
        { id: 'certificates', label: 'My Certificates', icon: 'fa-medal' },
        { id: 'letters', label: 'Official Letters', icon: 'fa-file-invoice' },
        { id: 'terms', label: 'Terms & Conditions', icon: 'fa-shield-halved' },
    ];

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-900">

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#002147] flex flex-col shadow-2xl transition-transform duration-500 ease-in-out ${mobileNav ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                {/* Logo Section (Premium Upgrade) */}
                <div className="p-6">
                    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-xl flex items-center justify-center transition-transform duration-300">
                        <img src={logo} alt="SLS Logo" className="h-14 object-contain" />
                    </div>
                    <div className="mt-4 text-center px-2">
                        <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Member Portal</p>
                    </div>
                </div>

                {/* Official Member ID - Clean Text Style */}
                <div className="px-8 pb-6">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5 pl-1">Official Member ID</p>
                    <p className="text-sm font-bold text-white tracking-widest pl-1">{user.id || "Awaiting Approval"}</p>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setMobileNav(false); }}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group ${activeTab === item.id ? 'bg-white text-[#002147] shadow-lg shadow-black/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === item.id ? "bg-[#002147]/5" : "bg-white/5 group-hover:bg-white/10"}`}>
                                <i className={`fas ${item.icon} ${activeTab === item.id ? "text-[#002147]" : "text-white/40 group-hover:text-white"}`} />
                            </div>
                            {item.label}
                        </button>
                    ))}
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
            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-5">
                        <button className="lg:hidden text-slate-500" onClick={() => setMobileNav(!mobileNav)}>
                            <i className={`fas ${mobileNav ? "fa-times" : "fa-bars"} text-lg`} />
                        </button>
                        <div>
                            <h1 className="text-slate-900 font-bold text-sm uppercase tracking-widest">{menuItems.find(t => t.id === activeTab)?.label || (activeTab === 'settings' ? 'Settings' : '')}</h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hidden sm:block">Member Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Admin Portal Button safely removed per user request */}
                        <button onClick={() => setActiveTab("settings")}
                            className="text-xs font-bold text-slate-500 hover:text-[#002147] w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 hover:bg-slate-50 rounded-xl flex items-center justify-center sm:justify-start gap-2 transition-all border border-transparent hover:border-slate-100">
                            <i className="fas fa-cog text-[14px] sm:text-xs" /> <span className="hidden sm:inline">Settings</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        {loading ? (
                            <Spinner />
                        ) : (
                            <>
                                {activeTab === 'dashboard' && renderDashboard()}
                                {activeTab === 'events' && renderEvents()}
                                {activeTab === 'announcements' && renderAnnouncements()}
                                {activeTab === 'certificates' && renderCertificates()}
                                {activeTab === 'letters' && renderLetters()}
                                {activeTab === 'settings' && renderSettings()}
                                {activeTab === 'terms' && <div className="animate-fade-up"><iframe src="/terms" className="w-full h-[80vh] rounded-[2.5rem] border border-slate-100 shadow-inner" /></div>}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MemberDashboard;