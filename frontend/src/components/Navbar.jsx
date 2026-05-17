import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Events", path: "/#events" },
    { name: "Contact", path: "/#contact" },
    { name: "Donate", path: "/donate" },
    { name: "Blogs", path: "/blogs" },
    { name: "Verify", path: "/verify" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const status = localStorage.getItem("status");

    if (token && status === "approved") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [location]);



  // Scroll spy
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }
    const handleScroll = () => {
      const sections = ["events", "contact"];
      let current = "";
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      if (window.scrollY < 100) current = "home";
      if (current) setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    setIsOpen(false);

    if (path.includes("#")) {
      const [page, hash] = path.split("#");
      if (location.pathname === page) {
        const element = document.getElementById(hash);
        if (element) element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    navigate(path);
    if (path.includes('#')) {
      const anchor = path.substring(path.indexOf('#'));
      setTimeout(() => {
        const element = document.querySelector(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const isLinkActive = (path) => {
    // If checking the "Home" root path
    if (path === "/") {
      return location.pathname === "/" && (activeSection === "home" || activeSection === "");
    }
    
    // For non-hash paths (like /about, /donate)
    if (!path.includes("#")) {
      return location.pathname === path;
    }
    
    // For hash paths (like /#events, /#contact)
    const sectionId = path.split("#")[1];
    if (location.pathname === "/" && activeSection === sectionId) return true;
    if (location.hash === `#${sectionId}`) return true;
    
    if (path === "verify") return false;
    
    return false;
  };



  const getLinkClass = (path, isMobile = false) => `
    ${isMobile ? "w-full text-center py-2.5 text-base" : "px-4 py-2 text-sm"} 
    rounded-full transition-all duration-300 border-2 font-medium
    ${isLinkActive(path)
      ? "border-slate-900 text-slate-900 font-bold bg-slate-50"
      : "border-transparent text-slate-600 hover:text-cyan-500 hover:bg-slate-50"
    }
  `;

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-10">

        {/* Logo */}
        <div className="flex items-center cursor-pointer transition-transform active:scale-95" onClick={() => handleNavigation("/")}>
          <img src={logo} alt="Serve & Lead" className="h-6 sm:h-7 md:h-8 w-auto object-contain" />
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigation(link.path)}
              className={getLinkClass(link.path)}
            >
              {link.name}
            </button>
          ))}

          {/* Login/Dashboard Button */}
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="ml-2 bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest hover:bg-cyan-600 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <i className="fas fa-user-circle text-cyan-400" /> Member Portal
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="ml-2 bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest hover:bg-cyan-600 transition-all duration-300 shadow-xl shadow-slate-900/10"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-slate-900 focus:outline-none p-2 rounded-xl bg-slate-50 border border-slate-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu - Premium Drawer Layout */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-50 flex flex-col px-8 overflow-y-auto transition-all duration-500 ease-in-out ${isOpen ? "max-h-[90vh] opacity-100 py-10" : "max-h-0 opacity-0 py-0"
          }`}
      >
        <div className="flex flex-col space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center">Navigation Menu</p>
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigation(link.path)}
              className={getLinkClass(link.path, true)}
            >
              {link.name}
            </button>
          ))}

          <div className="pt-6 mt-2 border-t border-slate-100 flex flex-col space-y-3">
            {isLoggedIn ? (
              <button
                onClick={() => { setIsOpen(false); navigate("/dashboard"); }}
                className="w-full bg-slate-900 text-white text-center py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-cyan-600 transition-all duration-300 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
              >
                <i className="fas fa-user-circle text-cyan-400" /> Member Portal
              </button>
            ) : (
              <>
                <button
                   onClick={() => { setIsOpen(false); navigate("/login"); }}
                   className="w-full bg-slate-50 text-slate-900 text-center py-4 rounded-2xl text-sm font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  Login to Account
                </button>
                <button
                   onClick={() => { setIsOpen(false); navigate("/register"); }}
                   className="w-full bg-slate-900 text-white text-center py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-cyan-600 transition-all"
                >
                  Join the Society
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
