import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";

export default function MemberLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("auth/login", credentials);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userName", response.data.member.name);
      localStorage.setItem("memberId", response.data.member.member_id || "Awaiting Approval");
      localStorage.setItem("userDbId", response.data.member.id);
      localStorage.setItem("status", response.data.member.status);
      localStorage.setItem("userEmail", response.data.member.email);
      localStorage.setItem("userRole", `${response.data.member.role} Member`);
      localStorage.setItem("joiningYear", response.data.member.joining_year || "20XX");

      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      const status = err.response?.status;
      let msg = err.response?.data?.error || "Invalid Credentials. Please try again.";
      
      if (status === 403) {
        msg = `Access Denied: ${msg}`;
      } else if (status === 401) {
        msg = "Incorrect email or password. Please verify and try again.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await api.post("auth/forgot-password", { email: forgotEmail });
      setForgotMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setForgotMessage({ type: 'error', text: err.response?.data?.error || "Failed to send reset link. Please try again." });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/30 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/30 blur-[100px] rounded-full -z-10" />

        <div className="w-full max-w-lg animate-fade-up">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-white p-8 md:p-12">
            <div className="text-center mb-10">
              <span className="text-cyan-600 font-black tracking-widest uppercase text-xs mb-3 block">Member Portal</span>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Welcome <span className="gradient-text">Back</span>
              </h1>
              <p className="text-slate-500 font-medium">Access your society dashboard and certificates.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-3 text-sm font-bold animate-shake">
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm pr-14"
                    placeholder="••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest hover:text-cyan-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-cyan-600 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-cyan-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Login <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-50 text-center space-y-4">
              <p className="text-sm font-bold text-slate-400">
                Don't have a membership yet?
                <button
                  onClick={() => navigate("/register")}
                  className="ml-2 text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Apply Now →
                </button>
              </p>
              <button
                onClick={() => navigate("/admin-login")}
                className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2 mx-auto mt-6 px-4 py-2 rounded-full hover:bg-slate-100"
              >
                <i className="fas fa-shield-halved"></i> Admin Access
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative animate-zoom-in">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-600" />
            <button 
              onClick={() => { setShowForgotModal(false); setForgotMessage(null); }}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl" />
            </button>

            <div className="p-10 pt-12">
              <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <i className="fas fa-key text-2xl" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Reset Password</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">Enter your registered Gmail address to receive a reset link.</p>

              {forgotMessage && (
                <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 ${
                  forgotMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  <i className={forgotMessage.type === 'success' ? "fas fa-check-circle" : "fas fa-exclamation-triangle"} />
                  {forgotMessage.text}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Gmail Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send reset link <i className="fas fa-paper-plane text-[10px]" /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
