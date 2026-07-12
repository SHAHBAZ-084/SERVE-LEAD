import { useState } from 'react';
import api, { getImgUrl } from '../../api';
import { generateCertificate } from '../../utils/canvasEngine';

export default function CertificateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('cert-templates/active-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { template, member } = res.data;
      await generateCertificate({
        template: {
          ...template,
          fileUrl: getImgUrl(template.fileUrl),
        },
        member,
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Your membership is not yet approved.');
      } else if (err.response?.status === 404) {
        setError('No certificate template available. Contact admin.');
      } else if (err.message === 'PDF library unavailable') {
        setError('PDF library unavailable');
      } else if (err.message === 'Template image could not be loaded') {
        setError('Template image could not be loaded');
      } else {
        setError(err.message || 'Certificate generation failed. Try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="bg-teal-50 border border-teal-200 text-[#005f6e] rounded-xl px-6 py-4 text-sm max-w-md text-center">
          {error}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="bg-[#00bcd4] hover:bg-[#0097a7] text-white font-semibold px-8 py-3 rounded-2xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base px-10 py-4 rounded-2xl shadow-lg shadow-[#00bcd4]/30 transition-all duration-200 flex items-center gap-3"
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-download'}`} />
        {loading ? 'Generating PDF...' : 'Download Membership Certificate'}
      </button>
      <p className="text-slate-400 text-xs text-center">
        Your certificate is generated automatically.
      </p>
    </div>
  );
}
