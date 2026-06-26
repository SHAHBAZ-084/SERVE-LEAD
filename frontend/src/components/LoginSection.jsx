import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Using your existing axios instance

export default function LoginSection() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ member_id: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW: State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // POST to the new Node.js endpoint
      const response = await api.post("auth/login", credentials);

      // Save Token and User Info to LocalStorage (adjusted for new response structure)
      localStorage.setItem("token", "cookie-auth-active");
      localStorage.setItem("userName", response.data.member.name);
      localStorage.setItem("memberId", response.data.member.id || "");
      localStorage.setItem("status", response.data.member.status);
      localStorage.setItem("userEmail", response.data.member.email);
      localStorage.setItem("userRole", `${response.data.member.role} Member`);
      localStorage.setItem("joiningYear", response.data.member.joining_year);

      // Redirect to the Dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.error || "Invalid Member ID or Password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="login" className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h2 className="text-4xl font-bold mb-10">
          <span className="text-black">Members</span> <span className="text-cyan-500">Login</span>
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-lg mx-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col space-y-6 max-w-lg mx-auto">


          {/* Email Input */}
          <div className="text-left">
            <label className="block text-gray-700 font-semibold mb-2 ml-1">Email *</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@gmail.com"
              value={credentials.email}
              onChange={handleChange}
              className="w-full border border-gray-400 rounded-md px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-lg placeholder:text-gray-300 placeholder:font-light"
              required
            />
          </div>

          {/* Password Input with Eye Button */}
          <div className="text-left relative">
            <label className="block text-gray-700 font-semibold mb-2 ml-1">Password *</label>
            <div className="relative">
              <input
                // Toggle between "text" and "password" based on state
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••••"
                value={credentials.password}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-lg pr-12 placeholder:text-gray-300 placeholder:font-light" // Added pr-12 for space
                required
              />

              {/* Eye Icon Button */}
              <button
                type="button" // Prevents form submission
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-cyan-600 transition"
              >
                {/* Shows Slash icon if visible, Normal Eye if hidden */}
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`bg-black text-white text-xl font-bold py-3 rounded-full transition shadow-lg mt-6 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex flex-col items-center mt-6 space-y-4">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-cyan-600 font-bold hover:underline transition text-sm"
            >
              Don't have an ID? Get Membership
            </button>
            <button
              type="button"
              onClick={() => navigate("/executive-register")}
              className="text-amber-600 font-bold hover:underline transition text-sm flex items-center gap-2"
            >
              <i className="fas fa-crown text-xs" /> Already a General Member? Apply for Executive
            </button>

            {/* Admin link */}
            <p className="text-sm text-gray-400 text-center">
              Are you an admin?{" "}
              <button
                type="button"
                onClick={() => navigate("/admin-login")}
                className="text-cyan-500 hover:text-cyan-600 font-medium transition"
              >
                Admin Login →
              </button>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
