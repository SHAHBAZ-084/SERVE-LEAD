import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const pakistaniUniversities = [
  "University of the Punjab", "Quaid-i-Azam University", "NUST", "UET Lahore", "UET Peshawar", 
  "UET Taxila", "COMSATS", "LUMS", "Aga Khan University", "FAST-NUCES", "PIEAS", "University of Karachi",
  "GCU Lahore", "FC College", "University of Agriculture, Faisalabad", "Peshawar University",
  "SZABIST", "IBA Karachi", "Bahria University", "Air University", "Habib University", "Other"
].sort();

export default function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    whatsapp: "",
    email: "",
    password: "",
    education_level: "Bachelor",
    program: "",
    passing_year: new Date().getFullYear().toString(),
    university: "UET Lahore",
    address: "",
    city: "",
    joining_year: new Date().getFullYear().toString(),
    otp: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [waLink, setWaLink] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateStep = () => {
    const { name, father_name, whatsapp, email, password, otp, program, passing_year, address, city } = formData;
    if (step === 1) {
      if (!name || !father_name || !whatsapp || !email || !password) return "All personal fields are mandatory.";
      if (whatsapp.length !== 11 || !/^\d+$/.test(whatsapp)) return "WhatsApp must be exactly 11 numeric digits.";
      if (!email.toLowerCase().endsWith("@gmail.com")) return "Only official @gmail.com accounts are permitted.";
      if (password.length < 6) return "Portal password must be at least 6 characters.";
      if (!otpSent) return "Please verify your Gmail address first.";
      if (!otp || otp.length !== 6) return "Please enter the 6-digit verification code.";
    } else if (step === 2) {
      if (!program || !passing_year) return "Education details are required.";
    } else if (step === 3) {
      if (!address || !city) return "Address details are required.";
    }
    return null;
  };

  const handleSendOtp = async () => {
    const { email } = formData;
    if (!email || !email.toLowerCase().endsWith("@gmail.com")) {
        setError("Please enter a valid @gmail.com address first.");
        return;
    }
    setError(null);
    setIsVerifying(true);
    try {
        await api.post("auth/send-otp", { email: email.trim() });
        setOtpSent(true);
        setError(null);
    } catch (err) {
        setError(err.response?.data?.error || "Failed to send verification code.");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    if (step === 1) {
      setLoading(true);
      try {
        await api.post("auth/verify-otp", {
          email: formData.email.trim(),
          code: formData.otp.trim()
        });
        // OTP is valid — clear it from state (security)
        setFormData(prev => ({ ...prev, otp: "" }));
      } catch (err) {
        setError(err.response?.data?.error || "Invalid verification code.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }
    if (!acceptedTerms) { setError("You must agree to the Terms and Conditions to proceed."); return; }

    setError(null);
    setLoading(true);

    try {
      const payload = { ...formData, email: formData.email.trim() };
      await api.post("auth/register", payload);
      try {
        const settingRes = await api.get("settings/whatsapp-link");
        setWaLink(settingRes.data.link || "");
      } catch (e) { console.error("Error fetching WA link:", e); }
      setSuccess(true);
      setTimeout(() => navigate("/"), 15000); // Extended timeout to allow joining group
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Check your info.");
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-12 md:mb-16 relative px-4 md:px-8">
      <div className="absolute top-[1.25rem] left-0 w-full h-1 bg-slate-50 -translate-y-1/2 z-0 rounded-full" />
      <div className={`absolute top-[1.25rem] left-0 h-1 bg-[#002147] transition-all duration-700 ease-in-out -translate-y-1/2 z-0 rounded-full`} style={{ width: `${((step - 1) / 2) * 100}%` }} />
      {[1, 2, 3].map((s) => (
        <div key={s} className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 shadow-xl border-2 ${step >= s ? 'bg-[#002147] text-white border-[#002147] scale-110' : 'bg-white text-slate-200 border-slate-50'}`}>
            {step > s ? <i className="fas fa-check text-xs" /> : s}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-4 ${step >= s ? 'text-[#002147]' : 'text-slate-200'}`}>
            {s === 1 ? 'Personal' : s === 2 ? 'Education' : 'Location'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <section className="bg-[#FAFBFD] py-16 md:py-32 min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#002147]/5 rounded-full blur-[150px] -mr-80 -mt-80" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[150px] -ml-80 -mb-80" />
        
        <div className="bg-white p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] w-full max-w-xl border border-slate-100 relative z-10">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Member <span className="gradient-text">Registration</span></h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-8 bg-[#002147]" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">Membership Portal</p>
              <div className="h-[2px] w-8 bg-[#002147]" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-600 px-6 py-5 mb-10 rounded-2xl flex items-center gap-4 animate-shake shadow-sm shadow-rose-200/20">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <i className="fas fa-exclamation text-xs" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-20 text-center animate-fade-up">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center text-5xl mb-10 mx-auto shadow-inner border border-emerald-100">
                <i className="fas fa-shield-check" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">Application Received</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose max-w-xs mx-auto mb-6">
                Your application has been successfully submitted. Our team will contact you shortly.
              </p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <i className="fab fa-whatsapp text-lg" /> Join WhatsApp Group
                </a>
              )}
              <div className="mt-14 space-y-4">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-loading-bar" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-300">Updating data...</p>
              </div>
            </div>
          ) : (
            <>
              <StepIndicator />
              
              <div className="transition-all duration-700">
                {step === 1 && (
                  <div className="space-y-7 animate-fade-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">01. Full Name</label>
                        <input name="name" placeholder="E.G. MUHAMMAD SHAHBAZ" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">02. Father Name</label>
                        <input name="father_name" placeholder="FATHER NAME" value={formData.father_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">03. WhatsApp (11 Digits)</label>
                        <input name="whatsapp" maxLength="11" placeholder="03XXXXXXXXX" value={formData.whatsapp} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">04. Gmail Address</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input type="email" name="email" placeholder="USER@GMAIL.COM" value={formData.email} onChange={(e) => { setOtpSent(false); handleChange(e); }} className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                          {!otpSent && (
                             <button type="button" onClick={handleSendOtp} disabled={isVerifying} className="bg-[#002147] text-white px-8 py-4 sm:py-0 rounded-[1.25rem] md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                {isVerifying ? <i className="fas fa-spinner fa-spin" /> : "Verify Gmail"}
                             </button>
                          )}
                        </div>
                      </div>

                      {otpSent && (
                        <div className="md:col-span-2 group animate-fade-up">
                           <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                             <i className="fas fa-paper-plane" /> 04B. Enter 6-Digit Code
                           </label>
                           <input type="text" maxLength="6" name="otp" placeholder="XXXXXX" value={formData.otp} onChange={handleChange} className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-center text-xl font-black text-emerald-700 tracking-[0.5em] shadow-inner focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200" />
                        </div>
                      )}

                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">05. Password (Min 6)</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all pr-16 shadow-inner" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200 hover:text-[#002147] transition-colors">
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleNext} disabled={loading} className="w-full bg-[#002147] text-white py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.4em] hover:bg-slate-800 transition-all shadow-2xl shadow-blue-900/30 mt-6 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center gap-4">
                      {loading ? (
                        <>Verifying... <i className="fas fa-spinner fa-spin" /></>
                      ) : (
                        <>Next Step <i className="fas fa-chevron-right ml-4" /></>
                      )}
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-fade-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Education Level</label>
                        <select name="education_level" value={formData.education_level} onChange={handleChange} className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-black text-slate-800 focus:bg-slate-50 transition-all appearance-none cursor-pointer outline-none focus:border-[#002147]">
                          {['Matric', 'Inter', 'Bachelor', 'Master', 'PhD', 'Other'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Program</label>
                        <input name="program" placeholder="E.G. BS COMPUTER SCIENCE" value={formData.program} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Graduation Year</label>
                        <input type="number" name="passing_year" value={formData.passing_year} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Institution</label>
                        <select name="university" value={formData.university} onChange={handleChange} className="w-full bg-white border-2 border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-black text-slate-800 focus:bg-slate-50 transition-all appearance-none cursor-pointer outline-none focus:border-[#002147]">
                          {pakistaniUniversities.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-5">
                      <button onClick={prevStep} className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Previous</button>
                      <button onClick={handleNext} className="flex-[2] bg-[#002147] text-white py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.4em] hover:bg-slate-800 transition-all shadow-2xl shadow-blue-900/30 active:scale-[0.98]">Next <i className="fas fa-chevron-right ml-4" /></button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-fade-up">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Home Address</label>
                      <input name="address" placeholder="HOUSE, STREET, SECTOR, AREA" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Your City</label>
                      <input name="city" placeholder="E.G. LAHORE" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id="tnc" 
                        checked={acceptedTerms} 
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-[#002147] focus:ring-[#002147] cursor-pointer"
                      />
                      <label htmlFor="tnc" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer select-none">
                        I agree to the <a href="/terms" target="_blank" className="text-[#002147] underline">Terms and Conditions</a>
                      </label>
                    </div>

                    <div className="flex gap-5">

                      <button onClick={prevStep} className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Back</button>
                      <button 
                        onClick={handleRegister} 
                        disabled={loading || !acceptedTerms} 
                        className={`flex-[2] py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-[0.98] ${loading || !acceptedTerms ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#002147] text-white hover:bg-emerald-600 shadow-2xl shadow-emerald-900/20'}`}
                      >
                        {loading ? <i className="fas fa-circle-notch fa-spin" /> : <i className="fas fa-check-double shadow-md" />} Finish Registration
                      </button>

                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 text-center">
                <button onClick={() => navigate("/")} className="text-cyan-600 text-sm font-bold hover:text-cyan-700 transition-colors flex items-center justify-center gap-2 mx-auto">
                    <i className="fas fa-arrow-left" /> Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
