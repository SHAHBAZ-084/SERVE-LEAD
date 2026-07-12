import { useState, useEffect, useCallback } from 'react';
import { getImgUrl, withMultipartAuth } from '../../api';
import ZoneCalibrator from './ZoneCalibrator';

export default function AdminTemplateManager({ auth, notify, api }) {
  const [templates, setTemplates] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showCalibrator, setShowCalibrator] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [calibratorDoc, setCalibratorDoc] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshTemplates = useCallback(async () => {
    try {
      const r = await api.get('cert-templates', auth);
      setTemplates(r.data || []);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Failed to load templates', 'error');
    }
  }, [api, auth, notify]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await api.get('cert-templates', auth);
        if (!cancelled) setTemplates(r.data || []);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          notify(err.response?.data?.error || 'Failed to load templates', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, auth, notify]);

  const openCalibrator = async (id) => {
    try {
      const r = await api.get(`cert-templates/${id}`, auth);
      setCalibratorDoc(r.data);
      setPreviewId(id);
      setShowCalibrator(true);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Failed to load template for calibration', 'error');
    }
  };

  const handleUpload = async () => {
    if (!fileInput) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('template', fileInput);
      fd.append('name', nameInput || 'Untitled');
      const r = await api.post('cert-templates/upload', fd, withMultipartAuth(auth));
      await refreshTemplates();
      setNameInput('');
      setFileInput(null);
      setPreview(null);
      notify('Template uploaded. Calibrate the zones.');
      await openCalibrator(r.data._id || r.data.templateId);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`cert-templates/${id}/activate`, {}, auth);
      await refreshTemplates();
      notify('Template activated. All members will use this template.');
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Failed to activate', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`cert-templates/${id}`, auth);
      await refreshTemplates();
      notify('Template deleted.');
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Deactivate first', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">
          Upload Membership Template
        </h3>
        <p className="text-xs text-slate-500">
          Upload a PNG/JPEG certificate background, calibrate text zones, then activate it for all members.
        </p>
        <input
          type="text"
          placeholder="Template name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold"
        />
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileInput(file || null);
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="w-full text-sm text-slate-600"
        />
        {preview && (
          <img src={preview} alt="Preview" className="max-h-40 rounded-lg mt-2 border border-slate-100" />
        )}
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !fileInput}
          className="px-6 py-3 bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">
          Certificate Templates
        </h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-[#00bcd4] border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No templates uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t._id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                    {t.isActive && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                    {!t.calibrated && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                        Needs Calibration
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t.uploadedAt
                      ? new Date(t.uploadedAt).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openCalibrator(t._id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-[#00bcd4] hover:text-[#0097a7]"
                  >
                    Calibrate Zones
                  </button>
                  <button
                    type="button"
                    disabled={t.isActive}
                    onClick={() => handleActivate(t._id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 disabled:opacity-40"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    disabled={t.isActive}
                    onClick={() => handleDelete(t._id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCalibrator && calibratorDoc && (
        <ZoneCalibrator
          templateUrl={getImgUrl(calibratorDoc.fileUrl)}
          zones={calibratorDoc.zones}
          onSave={async (newZones) => {
            try {
              await api.put(`cert-templates/${previewId}/zones`, { zones: newZones }, auth);
              setShowCalibrator(false);
              setCalibratorDoc(null);
              await refreshTemplates();
              notify('Calibration saved');
            } catch (err) {
              console.error(err);
              notify(err.response?.data?.error || 'Failed to save calibration', 'error');
              throw err;
            }
          }}
          onClose={() => {
            setShowCalibrator(false);
            setCalibratorDoc(null);
          }}
        />
      )}
    </div>
  );
}
