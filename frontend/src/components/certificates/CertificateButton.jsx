import { useState } from 'react';
import api, { getImgUrl } from '../../api';
import { generateCertificate } from '../../utils/canvasEngine';

export default function CertificateButton() {
  const [loading, setLoading] = useState(null); // 'pdf' | 'png' | null
  const [error, setError] = useState(null);

  const runDownload = async (format) => {
    setLoading(format);
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
        format,
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Your membership is not yet approved.');
      } else if (err.response?.status === 404) {
        setError('No membership certificate posted yet. Contact admin.');
      } else if (err.message === 'PDF library unavailable') {
        setError('PDF library unavailable');
      } else if (err.message === 'Template image could not be loaded') {
        setError('Template image could not be loaded');
      } else {
        setError(err.message || 'Certificate generation failed. Try again.');
      }
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="bg-teal-50 border border-teal-200 text-[#005f6e] rounded-xl px-6 py-4 text-sm max-w-md text-center">
          {error}
        </div>
        <button
          type="button"
          onClick={() => runDownload('pdf')}
          className="bg-[#00bcd4] hover:bg-[#0097a7] text-white font-semibold px-8 py-3 rounded-2xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4">
      <button
        type="button"
        onClick={() => runDownload('pdf')}
        disabled={!!loading}
        className="w-full sm:w-auto bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-60 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg shadow-[#00bcd4]/25 transition-all flex items-center justify-center gap-2"
      >
        <i className={`fas ${loading === 'pdf' ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`} />
        {loading === 'pdf' ? 'Generating…' : 'Download PDF'}
      </button>
      <button
        type="button"
        onClick={() => runDownload('png')}
        disabled={!!loading}
        className="w-full sm:w-auto bg-white hover:bg-slate-50 disabled:opacity-60 text-[#005f6e] font-semibold px-8 py-3.5 rounded-2xl border-2 border-teal-100 transition-all flex items-center justify-center gap-2"
      >
        <i className={`fas ${loading === 'png' ? 'fa-spinner fa-spin' : 'fa-image'}`} />
        {loading === 'png' ? 'Generating…' : 'Download PNG'}
      </button>
    </div>
  );
}
