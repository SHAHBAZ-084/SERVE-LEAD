import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import { useNotification } from "../context/NotificationContext";

// Lazy Load Tabs
const DashboardTab = lazy(() => import("./admin-tabs/DashboardTab"));
const MembersTab = lazy(() => import("./admin-tabs/MembersTab"));
const ApprovalsTab = lazy(() => import("./admin-tabs/ApprovalsTab"));
const EventsTab = lazy(() => import("./admin-tabs/EventsTab"));
const AnnouncementsTab = lazy(() => import("./admin-tabs/AnnouncementsTab"));
const CertificatesTab = lazy(() => import("./admin-tabs/CertificatesTab"));
const BatchesTab = lazy(() => import("./admin-tabs/BatchesTab"));
const AdminsTab = lazy(() => import("./admin-tabs/AdminsTab"));
const CustomizationTab = lazy(() => import("./admin-tabs/CustomizationTab"));
const LogsTab = lazy(() => import("./admin-tabs/LogsTab"));

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    </div>
);

function AdminPortal() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "dashboard";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [mobileNav, setMobileNav] = useState(false);
    const { notify } = useNotification();

    const adminUser = localStorage.getItem("adminUser");
    const isSuper = localStorage.getItem("adminIsSuper") === "1";
    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        if (!token) {
            navigate("/admin-login", { replace: true });
            return;
        }

        const restrictedTabs = ["admins", "customization", "logs"];
        if (restrictedTabs.includes(activeTab) && !isSuper) {
            setActiveTab("dashboard");
        }
    }, [activeTab, isSuper, token, navigate]);

    // Back-Button Trap
    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname + window.location.search);
        const handlePopState = () => window.history.go(1);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const logout = async () => {
        try {
            await api.post("admin/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error("Logout error", err);
        }
        localStorage.clear();
        navigate("/admin-login", { replace: true });
    };

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: "fa-th-large" },
        { id: "members", label: "Members", icon: "fa-users" },
        { id: "approvals", label: "Pending", icon: "fa-user-clock" },
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

    const renderTab = () => {
        switch (activeTab) {
            case "dashboard": return <DashboardTab adminUser={adminUser} setActiveTab={setActiveTab} isSuper={isSuper} tabs={tabs} />;
            case "members": return <MembersTab adminUser={adminUser} />;
            case "approvals": return <ApprovalsTab />;
            case "events": return <EventsTab />;
            case "announcements": return <AnnouncementsTab />;
            case "certificates": return <CertificatesTab />;
            case "batches": return <BatchesTab />;
            case "admins": return <AdminsTab adminUser={adminUser} />;
            case "customization": return <CustomizationTab />;
            case "logs": return <LogsTab />;
            default: return <DashboardTab adminUser={adminUser} setActiveTab={setActiveTab} isSuper={isSuper} tabs={tabs} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#002147]/10 selection:text-[#002147]">
            {/* Sidebar Desktop */}
            <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 hidden lg:flex flex-col shadow-sm">
                <div className="p-8">
                    <img src={logo} alt="SLS" className="h-10 w-auto mb-10" />
                    <nav className="space-y-1.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id
                                        ? "bg-[#002147] text-white shadow-xl shadow-blue-900/20 translate-x-1"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <i className={`fas ${tab.icon} text-sm`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-8 border-t border-slate-100">
                    <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 bg-rose-50 hover:bg-rose-100 font-black text-[10px] uppercase tracking-widest transition-all">
                        <i className="fas fa-power-off" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav */}
            <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-[60] shadow-sm">
                <img src={logo} alt="SLS" className="h-8 w-auto" />
                <button onClick={() => setMobileNav(!mobileNav)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-[#002147]">
                    <i className={`fas ${mobileNav ? 'fa-times' : 'fa-bars-staggered'} text-lg`} />
                </button>
            </header>

            {/* Mobile Menu Backdrop */}
            {mobileNav && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] lg:hidden" onClick={() => setMobileNav(false)}>
                    <div className="bg-white w-72 h-full p-8 animate-slide-right shadow-2xl" onClick={e => e.stopPropagation()}>
                        <img src={logo} alt="SLS" className="h-8 w-auto mb-10" />
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setMobileNav(false); }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id ? "bg-[#002147] text-white shadow-lg" : "text-slate-500"
                                    }`}
                                >
                                    <i className={`fas ${tab.icon}`} />
                                    {tab.label}
                                </button>
                            ))}
                            <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 bg-rose-50 font-black text-[10px] uppercase tracking-widest mt-4">
                                <i className="fas fa-power-off" /> Logout
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="lg:ml-72 p-6 sm:p-10 lg:p-16 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <Suspense fallback={<Spinner />}>
                        {renderTab()}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

export default AdminPortal;
