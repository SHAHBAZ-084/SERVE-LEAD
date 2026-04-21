import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getImgUrl } from "../api";
import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
const Spinner = () => (
    <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-[#002147] border-t-transparent rounded-full animate-spin" style={{ borderWidth: "3px" }} />
    </div>
);
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ── Shared Primitives ─────────────────────────────────────
const inputCls =
    "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#002147] focus:bg-white focus:outline-none transition-all duration-200 text-sm shadow-sm placeholder:text-slate-300";

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
        blue: { bg: "from-[#002147] to-[#003366]", shadow: "shadow-blue-900/10" },
        indigo: { bg: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-900/10" },
        sky: { bg: "from-blue-500 to-blue-700", shadow: "shadow-blue-900/10" },
        violet: { bg: "from-slate-800 to-slate-900", shadow: "shadow-slate-900/10" },
        emerald: { bg: "from-emerald-600 to-emerald-800", shadow: "shadow-emerald-900/10" },
    };
    const c = p[color] || p.blue;
    const rawStr = String(value ?? "0");
    const numeric = parseInt(rawStr, 10) || 0;
    const suffix = rawStr.replace(/^\d+/, "");
    const animated = useCountUp(numeric);
    return (
        <div className={`relative bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg ${c.shadow} overflow-hidden group hover:-translate-y-0.5 transition-all duration-300`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <i className={`fas ${icon} text-lg`} />
            </div>
            <p className="text-3xl font-extrabold tabular-nums">
                {value == null ? "—" : `${animated}${suffix}`}
            </p>
            <p className="text-white/75 text-[10px] font-bold mt-0.5 uppercase tracking-widest">{label}</p>
        </div>
    );
};

const MemberDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "dashboard";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [certificates, setCertificates] = useState([]);
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: "", email: "", id: "", dbId: "", role: "General", year: "20XX" });
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

    // Back-Button Trap: Prevent leaving the dashboard via 'Back' while authenticated
    useEffect(() => {
        const handlePopState = (e) => {
            window.history.pushState(null, "", window.location.href);
        };
        window.history.pushState(null, "", window.location.href);
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
    const [certAssets, setCertAssets] = useState({ logo: null, seal: null });

    useEffect(() => {
        const loadToDataURL = async (url, key) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setCertAssets(prev => ({ ...prev, [key]: reader.result }));
                reader.readAsDataURL(blob);
            } catch { } // eslint-disable-line no-empty
        };
        loadToDataURL(logo, 'logo');
        loadToDataURL(sealImg, 'seal');
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
            pdf.save(`SLS_Official_${user.name?.replace(/\s+/g, '_') || 'Award'}.pdf`);

            // Final Cleanup
            document.body.removeChild(iframe);
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert(`PDF Error: ${err.message}`);
        } finally {
            setExporting(false);
            setExportData(null);
        }
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
                <div style={{ backgroundColor: '#002147', paddingTop: '8px', paddingBottom: '8px', textAlign: 'center', color: '#ffffff' }}>
                    <h3 style={{ border: 'none', fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.2em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>MEMBER INFORMATION</h3>
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
                            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight text-shadow-sm">Welcome back, <span className="text-[#002147]">{user.name === "System Admin" ? "Member" : user.name}</span> <span className="inline-block animate-bounce shadow-xl">👋</span></h2>
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

                {/* Direct Action Hub (Professional Styling) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 pt-2 sm:pt-6">
                    <button onClick={() => setActiveTab("events")} className="group p-5 sm:p-10 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-slate-200/40 hover:-translate-y-1 sm:hover:-translate-y-3 transition-all text-left relative overflow-hidden flex items-center sm:block gap-4 sm:gap-8">
                        <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-[#002147]/10 transition-colors hidden sm:block"><i className="fas fa-calendar-alt text-7xl" /></div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-blue-50 text-blue-600 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-xl sm:text-2xl sm:mb-8 shadow-inner group-hover:bg-[#002147] group-hover:text-white transition-all duration-500"><i className="fas fa-calendar-star" /></div>
                        <div>
                            <h4 className="text-base sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-3 tracking-tight">Explore Events</h4>
                            <p className="text-slate-400 text-[9px] sm:text-[11px] font-medium uppercase tracking-[0.2em] leading-relaxed hidden sm:block">Browse upcoming events & registers</p>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab("certificates")} className="group p-5 sm:p-10 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-slate-200/40 hover:-translate-y-1 sm:hover:-translate-y-3 transition-all text-left relative overflow-hidden flex items-center sm:block gap-4 sm:gap-8">
                        <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-emerald-500/10 transition-colors hidden sm:block"><i className="fas fa-certificate text-7xl" /></div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-xl sm:text-2xl sm:mb-8 shadow-inner group-hover:bg-[#002147] group-hover:text-white transition-all duration-500"><i className="fas fa-award-simple" /></div>
                        <div>
                            <h4 className="text-base sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-3 tracking-tight">My Portfolio</h4>
                            <p className="text-slate-400 text-[9px] sm:text-[11px] font-medium uppercase tracking-[0.2em] leading-relaxed hidden sm:block">Access your official society credentials</p>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab("announcements")} className="group p-5 sm:p-10 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-slate-200/40 hover:-translate-y-1 sm:hover:-translate-y-3 transition-all text-left relative overflow-hidden flex items-center sm:block gap-4 sm:gap-8">
                        <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-indigo-500/10 transition-colors hidden sm:block"><i className="fas fa-bell text-7xl" /></div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-xl sm:text-2xl sm:mb-8 shadow-inner group-hover:bg-[#002147] group-hover:text-white transition-all duration-500"><i className="fas fa-bullhorn" /></div>
                        <div>
                            <h4 className="text-base sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-3 tracking-tight">Society News</h4>
                            <p className="text-slate-400 text-[9px] sm:text-[11px] font-medium uppercase tracking-[0.2em] leading-relaxed hidden sm:block">Stay updated with the latest news</p>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                                Awarded: {new Date(cert.createdAt).toLocaleDateString()}
                            </p>

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

            {/* HIGH-RESOLUTION GHOST EXPORT ENGINE */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '794px', height: '1123px', opacity: 0, pointerEvents: 'none', zIndex: -100, overflow: 'hidden' }}>
                {exportData && (
                    <div id="cert-export-node">
                        <CertificateTemplate data={exportData} />
                    </div>
                )}
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
                        const hasEnded = Date.now() > new Date(`${event.endDate || event.date}T23:59:59`).getTime();
                        const isJoined = event.participants?.some(p => p.memberId === user.dbId || p.memberId?._id === user.dbId);

                        return (
                            <div key={index} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all duration-500 group relative flex flex-col">
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

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <i className="fas fa-location-dot text-[#002147] text-xs" />
                                        {event.location || "Society Venue"}
                                    </div>

                                    <h3 className="font-bold text-2xl text-slate-800 mb-4 group-hover:text-[#002147] transition-colors leading-tight">
                                        {event.title}
                                    </h3>

                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-3">
                                        {event.description?.substring(0, 160)}...
                                    </p>

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

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-white/95 animate-fade-in backdrop-blur-xl">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col">
                        <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#002147] hover:bg-white shadow-sm transition-all z-10 border border-slate-100">
                            <i className="fas fa-times" />
                        </button>

                        <div className="h-56 overflow-hidden flex-shrink-0">
                            <img src={getImgUrl(selectedEvent.image_url)} className="w-full h-full object-cover" alt="" />
                        </div>

                        <div className="p-10 overflow-y-auto custom-scrollbar">
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
                                {activeTab === 'settings' && renderSettings()}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MemberDashboard;