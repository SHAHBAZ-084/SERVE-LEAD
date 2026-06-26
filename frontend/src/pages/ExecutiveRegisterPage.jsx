import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Abbottabad",
  "Bahawalpur", "Sargodha", "Sukkur",
];

const AREAS_OF_INTEREST = [
  "Community Development",
  "Education & Training",
  "Events Management",
  "Research & Policy",
  "Media & Communications",
  "Finance & Fundraising",
  "Other",
];

const inputCls =
  "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-[#002147] focus:outline-none transition-all";
const selectCls =
  "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#002147] focus:outline-none transition-all appearance-none cursor-pointer";
const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2";

const emptyForm = {
  name: "",
  father_name: "",
  city: "Lahore",
  address: "",
  area_of_interest: "Community Development",
  skills: "",
  mission_statement: "",
  short_term_goals: "",
  long_term_goals: "",
  why_executive: "",
  previous_volunteer_experience: "",
  availability: "",
  linkedin_url: "",
};

export default function ExecutiveRegisterPage() {
  const [step, setStep] = useState(1);
  const [memberId, setMemberId] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [verifyForm, setVerifyForm] = useState({ member_id: "" });
  const [form, setForm] = useState(emptyForm);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api.get("auth/verify-member", {
        params: { member_id: verifyForm.member_id.trim().toUpperCase() },
      });
      setMemberId(r.data.memberId);
      setVerifiedName(r.data.name);
      setForm((prev) => ({ ...prev, name: r.data.name }));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (s) => {
    if (s === 2) {
      if (!form.name.trim() || !form.father_name.trim() || !form.city || !form.address.trim()) {
        return "Please complete all personal details.";
      }
    }
    if (s === 3) {
      if (!form.skills.trim()) return "Skills are required.";
      if (form.mission_statement.trim().length < 50) return "Mission statement must be at least 50 characters.";
      if (form.short_term_goals.trim().length < 30) return "Short-term goals must be at least 30 characters.";
      if (form.long_term_goals.trim().length < 30) return "Long-term goals must be at least 30 characters.";
      if (form.why_executive.trim().length < 50) return "Why Executive must be at least 50 characters.";
      const hrs = Number(form.availability);
      if (!hrs || hrs < 1 || hrs > 40) return "Availability must be between 1 and 40 hours per week.";
    }
    if (s === 4 && !termsAccepted) return "You must confirm the terms before submitting.";
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep(4);
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("auth/apply-executive", {
        memberId,
        ...form,
        availability: Number(form.availability),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const CharCounter = ({ value, min }) => (
    <p className={`text-[10px] font-bold mt-1 ${value.length >= min ? "text-emerald-600" : "text-slate-400"}`}>
      {value.length} / {min} min characters
    </p>
  );

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-16">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-10 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-3xl" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Application Submitted</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-2">
              Thank you, <strong>{form.name || verifiedName}</strong>.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Your executive application has been submitted. The board will review your application and notify you via email.
            </p>
            <Link to="/login" className="inline-block px-8 py-3 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
              Back to Login
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-[#002147]/60 uppercase tracking-[0.3em] mb-2">Serve & Lead Society</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Apply for Executive Membership</h1>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              {step === 1
                ? "Existing General Members only. Enter your SLS Membership ID to begin."
                : "Complete your executive application in the steps below."}
            </p>
          </div>

          {step > 1 && verifiedName && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <i className="fas fa-user-check text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">Welcome, {verifiedName}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${step >= n ? "bg-[#002147] w-12" : "bg-slate-200 w-8"}`} />
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold text-rose-600">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className={labelCls}>Your SLS Membership ID</label>
                  <input
                    type="text"
                    required
                    placeholder="SLS-XXXX-XXXX"
                    value={verifyForm.member_id}
                    onChange={(e) => setVerifyForm({ member_id: e.target.value.toUpperCase() })}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-400 mt-2">Enter your official SLS Member ID. Must be an approved General Member.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Membership ID & Continue"}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Personal Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Name *</label>
                    <input name="name" required value={form.name} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Father Name *</label>
                    <input name="father_name" required value={form.father_name} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City *</label>
                    <select name="city" required value={form.city} onChange={handleChange} className={selectCls}>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Home Address *</label>
                    <input name="address" required value={form.address} onChange={handleChange} className={inputCls} placeholder="Full residential address" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">This information creates your executive profile and may appear in official records.</p>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Back</button>
                  <button type="button" onClick={goNext} className="flex-1 py-3 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Executive Application</h2>
                <div>
                  <label className={labelCls}>Area of Interest *</label>
                  <select name="area_of_interest" required value={form.area_of_interest} onChange={handleChange} className={selectCls}>
                    {AREAS_OF_INTEREST.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Your Skills *</label>
                  <textarea name="skills" required rows={3} value={form.skills} onChange={handleChange} placeholder="e.g. Public speaking, project management, graphic design..." className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Mission Statement *</label>
                  <textarea name="mission_statement" required rows={4} value={form.mission_statement} onChange={handleChange} placeholder="Describe what drives you to serve and lead. Minimum 50 characters." className={`${inputCls} resize-none`} />
                  <CharCounter value={form.mission_statement} min={50} />
                </div>
                <div>
                  <label className={labelCls}>Short-Term Goals (1 Year) *</label>
                  <textarea name="short_term_goals" required rows={3} value={form.short_term_goals} onChange={handleChange} placeholder="What do you plan to accomplish in your first year as an Executive Member?" className={`${inputCls} resize-none`} />
                  <CharCounter value={form.short_term_goals} min={30} />
                </div>
                <div>
                  <label className={labelCls}>Long-Term Goals (3–5 Years) *</label>
                  <textarea name="long_term_goals" required rows={3} value={form.long_term_goals} onChange={handleChange} placeholder="What impact do you want to create over the next 3–5 years?" className={`${inputCls} resize-none`} />
                  <CharCounter value={form.long_term_goals} min={30} />
                </div>
                <div>
                  <label className={labelCls}>Why Executive? (Motivation) *</label>
                  <textarea name="why_executive" required rows={4} value={form.why_executive} onChange={handleChange} placeholder="Why are you seeking Executive membership specifically, rather than continuing as a General Member?" className={`${inputCls} resize-none`} />
                  <CharCounter value={form.why_executive} min={50} />
                </div>
                <div>
                  <label className={labelCls}>Previous Volunteer / Leadership Experience</label>
                  <textarea name="previous_volunteer_experience" rows={3} value={form.previous_volunteer_experience} onChange={handleChange} placeholder="Describe any past volunteer work, leadership roles, or relevant achievements. Leave blank if none." className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Weekly Availability (hours) *</label>
                    <input type="number" name="availability" required min={1} max={40} value={form.availability} onChange={handleChange} className={inputCls} placeholder="Hours per week" />
                  </div>
                  <div>
                    <label className={labelCls}>LinkedIn Profile URL</label>
                    <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/your-profile" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Back</button>
                  <button type="button" onClick={goNext} className="flex-1 py-3 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Review Application</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Review & Submit</h2>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3 text-sm">
                  {[
                    ["Name", form.name],
                    ["Father Name", form.father_name],
                    ["City", form.city],
                    ["Address", form.address],
                    ["Area of Interest", form.area_of_interest],
                    ["Skills", form.skills],
                    ["Mission Statement", form.mission_statement],
                    ["Short-Term Goals", form.short_term_goals],
                    ["Long-Term Goals", form.long_term_goals],
                    ["Why Executive", form.why_executive],
                    ["Experience", form.previous_volunteer_experience || "—"],
                    ["Weekly Availability", `${form.availability} hours/week`],
                    ["LinkedIn", form.linkedin_url || "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">{val}</p>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm all information submitted is accurate and truthful. I understand that false information will result in disqualification.
                  </span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(3)} className="px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Back</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                    {loading ? "Submitting..." : "Submit Executive Application"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account? <Link to="/login" className="text-[#002147] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
