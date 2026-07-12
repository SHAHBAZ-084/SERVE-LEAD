import { useState } from 'react';
import useCertificateData from './useCertificateData';
import TemplateSelector from './TemplateSelector';
import { TEMPLATES } from '../../utils/certTemplates.config';
import { generateCertificate } from '../../utils/canvasEngine';

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div
      className="w-8 h-8 border-3 border-[#00bcd4] border-t-transparent rounded-full animate-spin"
      style={{ borderWidth: '3px' }}
    />
  </div>
);

export default function CertificateGenerator() {
  const { memberData, loading, error } = useCertificateData();
  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const handleDownload = async () => {
    const template = TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (!template || !memberData) return;

    setIsGenerating(true);
    setGenError(null);
    try {
      await generateCertificate(memberData, template);
    } catch (err) {
      setGenError(err.message || 'Failed to generate certificate.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <p className="text-[#005f6e] font-semibold text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-[#005f6e]">Membership Certificate</h3>
        <p className="text-sm text-slate-500">
          Choose a template and download your official SLS membership certificate.
        </p>
        <TemplateSelector
          templates={TEMPLATES}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
        />
        {genError && (
          <p className="text-sm text-rose-600 font-medium">{genError}</p>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full py-4 bg-[#00bcd4] hover:bg-[#0097a7] text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </button>
      </div>
    </div>
  );
}
