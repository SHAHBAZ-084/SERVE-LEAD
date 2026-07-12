import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [listError, setListError] = useState(null);
  const fileRef = useRef(null);

  const refreshTemplates = useCallback(async () => {
    try {
      const r = await api.get('cert-templates', auth);
      setTemplates(r.data || []);
      setListError(null);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const msg =
        err.response?.data?.error
        || (status === 404 ? 'Backend /api/cert-templates not found — wait for backend deploy.' : null)
        || (status === 401 ? 'Session expired. Log in again as admin.' : null)
        || (status === 403 ? 'Admin access required.' : null)
        || 'Failed to load templates';
      setListError(msg);
      notify(msg, 'error');
    }
  }, [api, auth, notify]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await api.get('cert-templates', auth);
        if (!cancelled) {
          setTemplates(r.data || []);
          setListError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          const status = err.response?.status;
          const msg =
            err.response?.data?.error
            || (status === 404 ? 'Backend /api/cert-templates not found — wait for backend deploy.' : null)
            || (status === 401 ? 'Session expired. Log in again as admin.' : null)
            || (status === 403 ? 'Admin access required.' : null)
            || 'Failed to load templates';
          setListError(msg);
          notify(msg, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, auth, notify]);

  const pickFile = (file) => {
    if (!file) return;
    const okType =
      file.type === 'image/png'
      || file.type === 'image/jpeg'
      || file.type === 'image/jpg'
      || /\.(png|jpe?g)$/i.test(file.name);
    if (!okType) {
      notify('Only PNG and JPEG images are accepted.', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      notify('Image must be under 15MB.', 'error');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFileInput(file);
    setPreview(URL.createObjectURL(file));
  };

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
    if (!fileInput) {
      notify('Step 1: click the box above and choose a PNG/JPEG file.', 'error');
      fileRef.current?.click();
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('template', fileInput);
      fd.append('name', nameInput.trim() || fileInput.name || 'Untitled');
      const r = await api.post('cert-templates/upload', fd, withMultipartAuth(auth));
      await refreshTemplates();
      setNameInput('');
      setFileInput(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      notify('Template uploaded. Calibrate the zones.');
      await openCalibrator(r.data._id || r.data.templateId);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const msg =
        err.response?.data?.error
        || (status === 404 ? 'Upload route not found. Redeploy the backend.' : null)
        || (status === 403 ? 'Admin access required.' : null)
        || (status === 401 ? 'Session expired. Log in again.' : null)
        || err.message
        || 'Upload failed';
      notify(msg, 'error');
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
          1) Enter a name · 2) Choose a PNG/JPEG file · 3) Click Upload & Analyze · 4) Calibrate · 5) Activate
        </p>

        {listError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold">
            {listError}
          </div>
        )}

        <input
          type="text"
          placeholder="Template name (e.g. SLS Membership 2026)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold"
        />

        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            fileInput
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-[#00bcd4]/40 bg-teal-50/40 hover:border-[#00bcd4] hover:bg-teal-50'
          }`}
        >
          <i className={`fas ${fileInput ? 'fa-check-circle text-emerald-500' : 'fa-cloud-upload-alt text-[#00bcd4]'} text-3xl mb-3 block`} />
          {fileInput ? (
            <>
              <p className="text-sm font-bold text-emerald-700">{fileInput.name}</p>
              <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-widest font-bold">
                {(fileInput.size / 1024 / 1024).toFixed(2)} MB · Click to change file
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-[#005f6e]">Click here to choose certificate image</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                PNG or JPEG · Max 15MB · Or drag & drop
              </p>
            </>
          )}
        </button>

        {preview && (
          <img src={preview} alt="Preview" className="max-h-48 rounded-xl border border-slate-100 mx-auto" />
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all ${
            fileInput
              ? 'bg-[#00bcd4] hover:bg-[#0097a7] shadow-lg shadow-teal-200'
              : 'bg-slate-300 cursor-pointer'
          } disabled:opacity-60`}
        >
          {uploading ? 'Uploading...' : fileInput ? 'Upload & Analyze' : 'Select a file first'}
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
