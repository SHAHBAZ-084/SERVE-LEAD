import { useState, useEffect } from "react";
import api from "../api";
import { signatureImg, stampImg, enrichCertificateData } from "../pages/CertTemplates";
import MembershipCertificateExact from "../pages/MembershipCertificateExact";
import { captureCertificatePdf } from "../utils/certificatePdfExport";

export default function VerificationSection() {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [membershipCert, setMembershipCert] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [certAssets, setCertAssets] = useState({ logo: null, signature: null, stamp: null });

  useEffect(() => {
    const loadToDataURL = async (url, key) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setCertAssets((prev) => ({ ...prev, [key]: reader.result }));
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(`Failed to load ${key}:`, err);
      }
    };
    loadToDataURL("/logo-certificate.png", "logo");
    loadToDataURL(signatureImg, "signature");
    loadToDataURL(stampImg, "stamp");
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!memberId) {
      alert("Please enter a Membership ID.");
      return;
    }

    const cleanId = memberId.trim().replace(/\./g, "-").replace(/-+/g, "-").toUpperCase();

    setLoading(true);
    setResult(null);
    setMembershipCert(null);
    try {
      const response = await api.get(`auth/verify/${cleanId}`);
      setResult(response.data.member);
      setMembershipCert(response.data.membershipCertificate || null);
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

  const downloadMembershipPdf = async () => {
    if (!membershipCert || !result) return;
    const enriched = enrichCertificateData(
      {
        ...membershipCert,
        memberId: {
          name: result.name,
          member_id: result.member_id,
          joining_year: result.joining_year,
          role: result.role,
        },
      },
      { session: result.joining_year }
    );
    setExportData(enriched);
    setExporting(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      await captureCertificatePdf("verify-section-export", {
        fileName: `SLS_Membership_${result.name.replace(/\s+/g, "_")}.pdf`,
      });
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
      setExportData(null);
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
            {membershipCert && (
              <button
                type="button"
                onClick={downloadMembershipPdf}
                disabled={exporting}
                className="mt-5 w-full bg-[#002147] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
              >
                {exporting ? "Preparing PDF..." : "Download Membership Certificate"}
              </button>
            )}
          </div>
        )}
      </div>

      <div
        id="verify-section-export"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none", zIndex: -1000 }}
      >
        <MembershipCertificateExact data={exportData || {}} certAssets={certAssets} id="verify-section-inner" />
      </div>
    </section>
  );
}
