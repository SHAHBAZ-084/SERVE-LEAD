import { useState } from "react";
import api from "../api";

export default function VerificationSection() {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!memberId) {
      alert("Please enter a Membership ID.");
      return;
    }

    const cleanId = memberId.trim().replace(/\./g, "-").replace(/-+/g, "-").toUpperCase();

    setLoading(true);
    setResult(null);
    try {
      const response = await api.get(`auth/verify/${cleanId}`);
      setResult(response.data.member);
    } catch (error) {
      console.error("Verification Error:", error);
      if (error.response?.status === 404) {
        alert(`Verification Failed\n\nMember ID "${cleanId}" was not found in our database.`);
      } else {
        alert("Connection Error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white py-20">
      <div className="max-w-md mx-auto text-center px-4">
        <h2 className="text-3xl font-bold mb-10">
          <span className="text-black">Member</span>{" "}
          <span className="text-cyan-500">Verification</span>
        </h2>

        <form onSubmit={handleVerify} className="flex flex-col items-center space-y-6">
          <div className="w-full">
            <label htmlFor="memberId" className="block text-left text-gray-800 font-medium mb-2">
              Membership ID
            </label>
            <input
              id="memberId"
              type="text"
              placeholder="20XX-SLS-XXXX"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-800"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 text-left mt-1 ml-1">
              * Enter the ID exactly as shown on your card.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`bg-black text-white px-8 py-2 rounded-md font-medium transition ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
          >
            {loading ? "Checking..." : "Verify Member"}
          </button>
        </form>

        {result && (
          <div className="mt-10 text-left bg-emerald-50 border border-emerald-100 rounded-xl p-6">
            <p className="text-emerald-700 font-bold text-sm uppercase tracking-widest mb-2">Verified Member</p>
            <p className="text-2xl font-black text-emerald-900">{result.name}</p>
            <p className="text-sm text-emerald-700 mt-1">
              {result.role} · Session {result.joining_year}
            </p>
            {result.member_id && (
              <p className="text-xs text-emerald-800 font-black uppercase tracking-widest mt-3">
                ID: {result.member_id}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
