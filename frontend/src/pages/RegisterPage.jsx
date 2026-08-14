import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { PROVINCES, getDistricts, getTehsils, getDefaultDistrict, getDefaultTehsil } from "../constants/pakistanLocations";

const pakistaniUniversities = [
  "University of the Punjab", "Quaid-i-Azam University", "NUST", "UET Lahore", "UET Peshawar", 
  "UET Taxila", "COMSATS", "LUMS", "Aga Khan University", "FAST-NUCES", "PIEAS", "University of Karachi",
  "GCU Lahore", "FC College", "University of Agriculture, Faisalabad", "Peshawar University",
  "SZABIST", "IBA Karachi", "Bahria University", "Air University", "Habib University", "Other"
].sort();

const APPLICANT_TYPES = [
  { id: 'university', label: 'University Student', icon: 'fa-university', hint: 'Currently enrolled in a university' },
  { id: 'college', label: 'College Student', icon: 'fa-building-columns', hint: 'Intermediate / college level' },
  { id: 'school', label: 'School Student', icon: 'fa-school', hint: 'Matric / school level' },
  { id: 'not_student', label: 'Not a Student', icon: 'fa-briefcase', hint: 'Working / other profession' },
];

const EDUCATION_BY_TYPE = {
  university: ['Bachelor', 'Master', 'PhD', 'Other'],
  college: ['Inter', 'Other'],
  school: ['Matric', 'Other'],
  not_student: ['Matric', 'Inter', 'Bachelor', 'Master', 'PhD', 'Other'],
};

const DEFAULT_PROVINCE = "Punjab";
const DEFAULT_DISTRICT = getDefaultDistrict(DEFAULT_PROVINCE);
const DEFAULT_TEHSIL = getDefaultTehsil(DEFAULT_PROVINCE, DEFAULT_DISTRICT);

const selectCls =
  "w-full bg-white border-2 border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-black text-slate-800 focus:bg-slate-50 transition-all appearance-none cursor-pointer outline-none focus:border-[#002147]";

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
    requestedRole: "General",
    name: "",
    father_name: "",
    gender: "",
    whatsapp: "",
    email: "",
    password: "",
    applicant_type: "university",
    education_level: "Bachelor",
    program: "",
    passing_year: new Date().getFullYear().toString(),
    university: "UET Lahore",
    institution_name: "",
    occupation: "",
    province: DEFAULT_PROVINCE,
    district: DEFAULT_DISTRICT,
    tehsil: DEFAULT_TEHSIL,
    address: "",
    joining_year: new Date().getFullYear().toString(),
    otp: "",
    sls_official_id: "",
    cnic_number: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [waLinks, setWaLinks] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "whatsapp") {
      setFormData({ ...formData, whatsapp: value.replace(/\D/g, "").slice(0, 11) });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const setApplicantType = (type) => {
    const levels = EDUCATION_BY_TYPE[type] || EDUCATION_BY_TYPE.university;
    setFormData((prev) => ({
      ...prev,
      applicant_type: type,
      education_level: levels.includes(prev.education_level) ? prev.education_level : levels[0],
      university: type === 'university' ? (prev.university || 'UET Lahore') : '',
      institution_name: type === 'university' ? '' : prev.institution_name,
      occupation: type === 'not_student' ? prev.occupation : '',
      program: type === 'not_student' ? '' : prev.program,
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === "province") {
      const district = getDefaultDistrict(value);
      setFormData({
        ...formData,
        province: value,
        district,
        tehsil: getDefaultTehsil(value, district),
      });
      return;
    }
    if (name === "district") {
      setFormData({
        ...formData,
        district: value,
        tehsil: getDefaultTehsil(formData.province, value),
      });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const districtOptions = getDistricts(formData.province);
  const tehsilOptions = getTehsils(formData.province, formData.district);

  const validateStep = () => {
    const { name, father_name, gender, whatsapp, email, password, otp, address, province, district, tehsil } = formData;
    if (step === 1) {
      if (!name || !father_name || !whatsapp || !email || !password) return "All personal fields are mandatory.";
      if (!gender || (gender !== "Male" && gender !== "Female")) return "Please select your gender.";
      if (whatsapp.length !== 11 || !/^\d+$/.test(whatsapp)) return "WhatsApp must be exactly 11 numeric digits.";
      if (!email.toLowerCase().endsWith("@gmail.com")) return "Only official @gmail.com accounts are permitted.";
      if (password.length < 6) return "Portal password must be at least 6 characters.";
      if (!otpSent) return "Please verify your Gmail address first.";
      if (!otp || otp.length !== 6) return "Please enter the 6-digit verification code.";
    } else if (step === 2) {
      const { applicant_type, program, passing_year, university, institution_name, occupation, education_level } = formData;
      if (!applicant_type) return "Please select your status (university, college, school, or not a student).";
      if (!education_level) return "Education level is required.";
      if (applicant_type === 'not_student') {
        if (!occupation?.trim()) return "Please enter your occupation / profession.";
      } else {
        if (!program?.trim()) {
          if (applicant_type === 'school') return "Please enter your class / grade.";
          return "Program / field of study is required.";
        }
        if (!passing_year) return "Year is required.";
        if (applicant_type === 'university' && !university) return "Please select your university.";
        if ((applicant_type === 'college' || applicant_type === 'school') && !institution_name?.trim()) {
          return applicant_type === 'college' ? "College name is required." : "School name is required.";
        }
      }
    } else if (step === 3) {
      if (!province || !district || !tehsil) return "Please select province, district, and tehsil.";
      if (!address?.trim()) return "Residential address is required.";
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
      const { otp, ...rest } = formData;
      const payload = {
        ...rest,
        email: formData.email.trim(),
        gender: formData.gender,
        requestedRole: "General",
        sls_official_id: "",
        cnic_number: "",
      };
      await api.post("auth/register", payload);
      try {
        const settingRes = await api.get("settings/whatsapp-link");
        const url = String(
          settingRes.data.defaultLink
          || (settingRes.data.links || []).find((l) => l.key === "default")?.url
          || ""
        ).trim();
        setWaLinks(url ? [{ key: "default", label: "Society WhatsApp Group", url }] : []);
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
              <h3 className="text-4xl font-black text-slate-900 mb-5 tracking-tight uppercase">Registration Successful</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose max-w-xs mx-auto mb-6">
                Your application has been successfully submitted. Our team will contact you shortly for further processing.
              </p>
              {waLinks.filter((item) => item.key === "default").slice(0, 1).length > 0 && (
                <div className="flex flex-col gap-3 items-center mb-2">
                  {waLinks.filter((item) => item.key === "default").slice(0, 1).map((item) => (
                    <a
                      key={item.key + item.url}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp"
                    >
                      <i className="fab fa-whatsapp text-lg" /> {item.label || "Join WhatsApp Group"}
                    </a>
                  ))}
                </div>
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
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] space-y-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">New Member Registration</label>
                      <div className="px-5 py-4 rounded-[1.25rem] border-2 border-[#002147] bg-white shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#002147] text-white">
                            <i className="fas fa-user" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">General Member</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard membership for new applicants</p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/executive-register")}
                        className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors">
                            <i className="fas fa-crown" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-800">Already a General Member?</p>
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Apply for Executive Membership →</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">01. Full Name</label>
                        <input name="name" placeholder="E.G. MUHAMMAD SHAHBAZ" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">02. Father Name</label>
                        <input name="father_name" placeholder="FATHER NAME" value={formData.father_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">03. Gender</label>
                        <div className="grid grid-cols-2 gap-3">
                          {["Male", "Female"].map((g) => {
                            const active = formData.gender === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g })}
                                className={`px-5 py-4 rounded-[1.25rem] border-2 text-sm font-black uppercase tracking-widest transition-all ${
                                  active
                                    ? "border-[#002147] bg-[#002147] text-white shadow-md"
                                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                                }`}
                              >
                                <i className={`fas ${g === "Male" ? "fa-mars" : "fa-venus"} mr-2`} />
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">04. WhatsApp (11 Digits)</label>
                        <input name="whatsapp" maxLength="11" placeholder="03XXXXXXXXX" value={formData.whatsapp} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">05. Gmail Address</label>
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
                             <i className="fas fa-paper-plane" /> 05B. Enter 6-Digit Code
                           </label>
                           <input type="text" maxLength="6" name="otp" placeholder="XXXXXX" value={formData.otp} onChange={handleChange} className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-center text-xl font-black text-emerald-700 tracking-[0.5em] shadow-inner focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200" />
                        </div>
                      )}

                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">06. Password (Min 6)</label>
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
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">
                        I am a…
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {APPLICANT_TYPES.map((t) => {
                          const active = formData.applicant_type === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setApplicantType(t.id)}
                              className={`text-left px-4 py-4 rounded-[1.25rem] border-2 transition-all ${
                                active
                                  ? 'border-[#002147] bg-[#002147]/5 shadow-md'
                                  : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  active ? 'bg-[#002147] text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <i className={`fas ${t.icon} text-xs`} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-800">{t.label}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.hint}</p>
                                </div>
                                {active && <i className="fas fa-check-circle text-[#002147] ml-auto mt-1" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">
                          {formData.applicant_type === 'not_student' ? 'Highest Education' : 'Education Level'}
                        </label>
                        <select name="education_level" value={formData.education_level} onChange={handleChange} className={selectCls}>
                          {(EDUCATION_BY_TYPE[formData.applicant_type] || EDUCATION_BY_TYPE.university).map((l) => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {formData.applicant_type === 'not_student' ? (
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Occupation / Profession</label>
                          <input name="occupation" placeholder="E.G. SOFTWARE ENGINEER" value={formData.occupation} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                        </div>
                      ) : (
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">
                            {formData.applicant_type === 'school' ? 'Class / Grade' : 'Program / Field'}
                          </label>
                          <input
                            name="program"
                            placeholder={formData.applicant_type === 'school' ? 'E.G. CLASS 10' : 'E.G. BS COMPUTER SCIENCE'}
                            value={formData.program}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {formData.applicant_type !== 'not_student' && (
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">
                            {formData.applicant_type === 'school' ? 'Expected / Passing Year' : 'Graduation Year'}
                          </label>
                          <input type="number" name="passing_year" value={formData.passing_year} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner" />
                        </div>
                      )}

                      {formData.applicant_type === 'university' && (
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">University</label>
                          <select name="university" value={formData.university} onChange={handleChange} className={selectCls}>
                            {pakistaniUniversities.map((u) => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                          </select>
                        </div>
                      )}

                      {(formData.applicant_type === 'college' || formData.applicant_type === 'school') && (
                        <div className="group md:col-span-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">
                            {formData.applicant_type === 'college' ? 'College Name' : 'School Name'}
                          </label>
                          <input
                            name="institution_name"
                            placeholder={formData.applicant_type === 'college' ? 'E.G. GOVERNMENT COLLEGE LAHORE' : 'E.G. ABC HIGH SCHOOL'}
                            value={formData.institution_name}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {formData.applicant_type === 'not_student' && (
                        <div className="group md:col-span-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">
                            Workplace / Organization <span className="text-slate-300">(optional)</span>
                          </label>
                          <input
                            name="institution_name"
                            placeholder="E.G. COMPANY / ORGANIZATION NAME"
                            value={formData.institution_name}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-5">
                      <button onClick={prevStep} className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Previous</button>
                      <button onClick={handleNext} className="flex-[2] bg-[#002147] text-white py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.4em] hover:bg-slate-800 transition-all shadow-2xl shadow-blue-900/30 active:scale-[0.98]">Next <i className="fas fa-chevron-right ml-4" /></button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-fade-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Province</label>
                        <select name="province" value={formData.province} onChange={handleLocationChange} className={selectCls}>
                          {PROVINCES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">District</label>
                        <select name="district" value={formData.district} onChange={handleLocationChange} className={selectCls} disabled={!formData.province}>
                          {districtOptions.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Tehsil</label>
                        <select name="tehsil" value={formData.tehsil} onChange={handleLocationChange} className={selectCls} disabled={!formData.district}>
                          {tehsilOptions.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-[#002147] transition-colors">Complete Residential Address</label>
                      <textarea
                        name="address"
                        rows={3}
                        placeholder="HOUSE NO, STREET, MOHALLA, NEAR LANDMARK"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] px-5 py-4 md:px-6 md:py-5 text-sm font-bold text-slate-800 placeholder:text-slate-200 placeholder:font-black focus:ring-8 focus:ring-blue-500/5 focus:border-[#002147] outline-none transition-all shadow-inner resize-none"
                      />
                    </div>

                    {/* Premium Acknowledgement Card */}
                    <div 
                      onClick={() => setAcceptedTerms(!acceptedTerms)}
                      className={`group relative overflow-hidden flex items-center gap-5 px-6 py-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer ${
                        acceptedTerms 
                        ? 'bg-emerald-50/50 border-emerald-500/30 shadow-lg shadow-emerald-900/5' 
                        : 'bg-white border-slate-100 hover:border-[#002147]/20 hover:bg-slate-50/50 shadow-xl shadow-slate-200/20'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        acceptedTerms ? 'bg-emerald-500 text-white rotate-[360deg]' : 'bg-slate-100 text-slate-400 group-hover:bg-[#002147]/5 group-hover:text-[#002147]'
                      }`}>
                        {acceptedTerms ? (
                          <i className="fas fa-check text-lg" />
                        ) : (
                          <i className="fas fa-shield-halved text-lg" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors ${acceptedTerms ? 'text-emerald-700' : 'text-slate-400'}`}>
                          Legal Compliance
                        </p>
                        <label className={`text-[11px] font-bold uppercase tracking-widest cursor-pointer select-none transition-colors ${acceptedTerms ? 'text-emerald-900' : 'text-slate-600'}`}>
                          I agree to the <a href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-[#002147] underline decoration-2 underline-offset-4 hover:text-blue-600 transition-colors">Terms and Conditions</a>
                        </label>
                      </div>

                      {/* Animated checkmark indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        acceptedTerms ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-200 bg-white'
                      }`}>
                        <div className={`w-2 h-2 rounded-full bg-white transition-all duration-500 ${acceptedTerms ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                      </div>
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
