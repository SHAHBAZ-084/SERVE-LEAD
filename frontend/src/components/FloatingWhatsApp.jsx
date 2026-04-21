import React from 'react';
import { useLocation } from 'react-router-dom';

export default function FloatingWhatsApp() {
    const location = useLocation();
    
    // Check for tokens
    const isMemberLoggedIn = !!localStorage.getItem("token");
    const isAdminLoggedIn = !!localStorage.getItem("adminToken");
    
    // Check for protected paths
    const isDashboard = location.pathname.includes("/dashboard");
    const isAdminPortal = location.pathname.includes("/admin-portal");

    // Hide if logged in OR on dashboard/admin pages
    if (isMemberLoggedIn || isAdminLoggedIn || isDashboard || isAdminPortal) {
        return null;
    }

    return (
        <a 
            href="https://wa.me/923141683402?text=Hello%20SLS!%20I%20have%20a%20query%20regarding%20the%20society." 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-[9999] group"
            aria-label="Contact SLS on WhatsApp"
        >
            <div className="relative">
                {/* Ping Animation */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:hidden" />
                
                {/* Main Icon Circle */}
                <div className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-[360deg] active:scale-95">
                    <i className="fab fa-whatsapp text-white text-3xl md:text-4xl" />
                </div>
                
                {/* Label Overlay (Optional, but helps UX) */}
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Chat with SLS Support</p>
                </div>
            </div>
        </a>
    );
}
