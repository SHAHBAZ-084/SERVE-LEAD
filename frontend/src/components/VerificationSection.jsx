import { useState } from "react";
import api from "../api";
import { useNotification } from "../context/NotificationContext";

export default function VerificationSection() {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!memberId) {
      notify("Please enter a Membership ID.", "error");
      return;
    }

    // Auto-fix format: replace dots with dashes to match backend
    let cleanId = memberId.trim().replace(/\./g, "-").replace(/-+/g, "-");
    
    setLoading(true);
    try {
      const response = await api.get(`member/${cleanId}/`);
      
      // SUCCESS: Just show the verification message (No window.open)
      notify(`✅ VERIFIED MEMBER\n\nName: ${response.data.name}\nID: ${response.data.member_id}\nStatus: Active Member`);
      
    } catch (error) {
      console.error("Verification Error:", error);
      if (error.response && error.response.status === 404) {
        notify(`❌ Verification Failed\n\nMember ID "${cleanId}" was not found in our database.`, "error");
      } else {
        notify("⚠️ Connection Error. Please ensure the backend is running.", "error");
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

        <form
          onSubmit={handleVerify}
          className="flex flex-col items-center space-y-6"
        >
          <div className="w-full">
            <label
              htmlFor="memberId"
              className="block text-left text-gray-800 font-medium mb-2"
            >
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
      </div>
    </section>
  );
}
