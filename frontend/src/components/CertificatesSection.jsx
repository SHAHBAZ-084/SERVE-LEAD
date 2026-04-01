import { useState, useEffect } from "react";
import api from "../api";
import useScrollReveal from "../hooks/useScrollReveal";

export default function CertificatesSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ certificateType: "", eventSlug: "", memberId: "" });
  const ref = useScrollReveal();

  useEffect(() => {
    if (form.certificateType === "participation") {
      api.get("events/slugs/")
        .then((res) => setEvents(res.data))
        .catch((err) => console.error("Error fetching event slugs:", err));
    }
  }, [form.certificateType]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDownload = async () => {
    setLoading(true);
    try {
      let certificateUrl = "";
      if (form.certificateType === "membership") {
        const response = await api.get(`member/${form.memberId}/`);
        certificateUrl = response.data.certificate_url;
      } else {
        const response = await api.post("certificates/search/", {
          member_id: form.memberId,
          event_slug: form.eventSlug,
        });
        certificateUrl = response.data.certificate_url || response.data.file_url;
      }
      if (certificateUrl) {
        window.open(certificateUrl, "_blank");
      } else {
        alert("Certificate found, but no file is attached. Please contact admin.");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "ID not found or network error.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-400";

  return (
    <section ref={ref} id="certifications" className="bg-white py-20 overflow-hidden">
      <div className="max-w-lg mx-auto text-center px-6">
        <div className="reveal">
          <span className="inline-block bg-cyan-100 text-cyan-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Quick Access
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Get Your <span className="text-cyan-500">Certificate</span>
          </h2>
          <p className="text-gray-500 text-sm mb-8">Enter your member ID to download your certificate instantly.</p>
        </div>

        <div className="reveal delay-200 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleDownload(); }} className="space-y-4 text-left">
            {/* Certificate Type */}
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1.5">Certificate Type</label>
              <select
                name="certificateType"
                value={form.certificateType}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select Type</option>
                <option value="membership">Membership Certificate</option>
                <option value="participation">Participation Certificate</option>
              </select>
            </div>

            {/* Event Dropdown */}
            {form.certificateType === "participation" && (
              <div className="animate-fade-up">
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Select Event</label>
                <select
                  name="eventSlug"
                  value={form.eventSlug}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Choose Event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.slug}>{event.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Member ID */}
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1.5">Member ID</label>
              <input
                type="text"
                name="memberId"
                placeholder="e.g. 2025-SLS-UET100"
                value={form.memberId}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-3.5 rounded-xl font-bold text-base transition-all duration-300 mt-2 flex items-center justify-center gap-2 ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02] active:scale-100"
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <i className="fas fa-download" />
                  Download Certificate
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}