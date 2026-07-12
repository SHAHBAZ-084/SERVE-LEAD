import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getImgUrl, withMultipartAuth } from '../../api';
import ZoneCalibrator from './ZoneCalibrator';
import { clearCertificateImageCache } from '../../utils/canvasEngine';

function TemplateUploadCard({
  title,
  hint,
  kind,
  nameInput,
  setNameInput,
  fileInput,
  preview,
  uploading,
  fileRef,
  onPickFile,
  onUpload,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">{title}</h3>
      <p className="text-xs text-slate-500">{hint}</p>

      <input
        type="text"
        placeholder={kind === 'membership' ? 'e.g. SLS Membership 2026' : 'e.g. Event Appreciation Template'}
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold"
      />

      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPickFile(e.dataTransfer.files?.[0]);
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
            <p className="text-sm font-bold text-[#005f6e]">Click to choose PNG/JPEG</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Max 15MB · Or drag & drop</p>
          </>
        )}
      </button>

      {preview && (
        <img src={preview} alt="Preview" className="max-h-48 rounded-xl border border-slate-100 mx-auto" />
      )}

      <button
        type="button"
        onClick={onUpload}
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
  );
}

function TemplateList({
  title,
  hint,
  templates,
  loading,
  activatingId,
  onCalibrate,
  onActivate,
  onDelete,
  activateLabel,
  activeBadge,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#002147]">{title}</h3>
      <p className="text-xs text-slate-500">{hint}</p>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-3 border-[#00bcd4] border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No templates in this section yet.</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const idStr = String(t._id);
            const isActive = !!t.isActive;
            const isActivating = activatingId === idStr;
            return (
              <div
                key={idStr}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-100'
                    : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                    {isActive && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                        {activeBadge}
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
                    onClick={() => onCalibrate(t._id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:border-[#00bcd4] hover:text-[#0097a7]"
                  >
                    Calibrate Zones
                  </button>
                  <button
                    type="button"
                    disabled={isActive || isActivating}
                    onClick={() => onActivate(t._id)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      isActive
                        ? 'bg-emerald-200 text-emerald-800 border-emerald-300 cursor-default'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                    } disabled:opacity-50`}
                  >
                    {isActivating ? 'Working…' : isActive ? 'Currently Active' : activateLabel}
                  </button>
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => onDelete(t._id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminTemplateManager({ auth, notify, api }) {
  const [templates, setTemplates] = useState([]);
  const [uploadingKind, setUploadingKind] = useState(null);
  const [showCalibrator, setShowCalibrator] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [calibratorDoc, setCalibratorDoc] = useState(null);
  const [membershipName, setMembershipName] = useState('');
  const [generalName, setGeneralName] = useState('');
  const [membershipFile, setMembershipFile] = useState(null);
  const [generalFile, setGeneralFile] = useState(null);
  const [membershipPreview, setMembershipPreview] = useState(null);
  const [generalPreview, setGeneralPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const membershipFileRef = useRef(null);
  const generalFileRef = useRef(null);

  const membershipTemplates = useMemo(
    () => templates.filter((t) => (t.kind || 'general') === 'membership'),
    [templates]
  );
  const generalTemplates = useMemo(
    () => templates.filter((t) => (t.kind || 'general') !== 'membership'),
    [templates]
  );

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
          setListError(err.response?.data?.error || 'Failed to load templates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, auth]);

  const pickFile = (kind, file) => {
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
    if (kind === 'membership') {
      if (membershipPreview) URL.revokeObjectURL(membershipPreview);
      setMembershipFile(file);
      setMembershipPreview(URL.createObjectURL(file));
    } else {
      if (generalPreview) URL.revokeObjectURL(generalPreview);
      setGeneralFile(file);
      setGeneralPreview(URL.createObjectURL(file));
    }
  };

  const openCalibrator = async (id) => {
    try {
      const r = await api.get(`cert-templates/${id}`, auth);
      const imagePath = r.data.imageUrl || `/api/cert-templates/${id}/image`;
      const imgRes = await fetch(getImgUrl(imagePath), {
        credentials: 'include',
        headers: auth?.headers || {},
      });
      if (!imgRes.ok) throw new Error('Failed to load template image');
      const blob = await imgRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      setCalibratorDoc({ ...r.data, _previewObjectUrl: objectUrl });
      setPreviewId(id);
      setShowCalibrator(true);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || err.message || 'Failed to load template for calibration', 'error');
    }
  };

  const handleUpload = async (kind) => {
    const fileInput = kind === 'membership' ? membershipFile : generalFile;
    const nameInput = kind === 'membership' ? membershipName : generalName;
    const fileRef = kind === 'membership' ? membershipFileRef : generalFileRef;
    if (!fileInput) {
      notify('Choose a PNG/JPEG file first.', 'error');
      fileRef.current?.click();
      return;
    }
    setUploadingKind(kind);
    try {
      const fd = new FormData();
      fd.append('template', fileInput);
      fd.append('name', nameInput.trim() || fileInput.name || 'Untitled');
      fd.append('kind', kind);
      const r = await api.post('cert-templates/upload', fd, withMultipartAuth(auth));
      await refreshTemplates();
      if (kind === 'membership') {
        setMembershipName('');
        setMembershipFile(null);
        if (membershipPreview) URL.revokeObjectURL(membershipPreview);
        setMembershipPreview(null);
        if (membershipFileRef.current) membershipFileRef.current.value = '';
      } else {
        setGeneralName('');
        setGeneralFile(null);
        if (generalPreview) URL.revokeObjectURL(generalPreview);
        setGeneralPreview(null);
        if (generalFileRef.current) generalFileRef.current.value = '';
      }
      notify(`${kind === 'membership' ? 'Membership' : 'Issue'} template uploaded. Calibrate zones.`);
      clearCertificateImageCache();
      await openCalibrator(r.data._id || r.data.templateId);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || err.message || 'Upload failed', 'error');
    } finally {
      setUploadingKind(null);
    }
  };

  const handleActivate = async (id) => {
    const idStr = String(id);
    const target = templates.find((t) => String(t._id) === idStr);
    const kind = (target?.kind || 'general') === 'membership' ? 'membership' : 'general';
    setActivatingId(idStr);
    try {
      const r = await api.put(`cert-templates/${idStr}/activate`, {}, auth);
      clearCertificateImageCache();
      setTemplates((prev) =>
        prev.map((t) => {
          const tKind = (t.kind || 'general') === 'membership' ? 'membership' : 'general';
          if (tKind !== kind) return t;
          return { ...t, isActive: String(t._id) === idStr };
        })
      );
      await refreshTemplates();
      if (kind === 'membership') {
        const n = r.data?.membersGranted;
        notify(
          n != null
            ? `Membership template posted — live for ${n} member(s).`
            : 'Membership template posted to all members.'
        );
      } else {
        notify('Template activated for issuing certificates.');
      }
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.error || 'Failed to activate template', 'error');
    } finally {
      setActivatingId(null);
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
      {listError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold">
          {listError}
        </div>
      )}

      <TemplateUploadCard
        title="Membership Template"
        hint="Upload → calibrate → Activate / Post. Posts membership certificate to all approved members (and new approvals)."
        kind="membership"
        nameInput={membershipName}
        setNameInput={setMembershipName}
        fileInput={membershipFile}
        preview={membershipPreview}
        uploading={uploadingKind === 'membership'}
        fileRef={membershipFileRef}
        onPickFile={(f) => pickFile('membership', f)}
        onUpload={() => handleUpload('membership')}
      />

      <TemplateList
        title="Membership Templates"
        hint="Activate one membership template to auto-post it for every member."
        templates={membershipTemplates}
        loading={loading}
        activatingId={activatingId}
        onCalibrate={openCalibrator}
        onActivate={handleActivate}
        onDelete={handleDelete}
        activateLabel="Post to Members"
        activeBadge="Posted — live for members"
      />

      <TemplateUploadCard
        title="Issue Templates (Awards / Events)"
        hint="Upload any award or event design → calibrate → Activate, then use Issue with Preview."
        kind="general"
        nameInput={generalName}
        setNameInput={setGeneralName}
        fileInput={generalFile}
        preview={generalPreview}
        uploading={uploadingKind === 'general'}
        fileRef={generalFileRef}
        onPickFile={(f) => pickFile('general', f)}
        onUpload={() => handleUpload('general')}
      />

      <TemplateList
        title="Issue Templates"
        hint="Activate the template you will use for the next admin Issue (preview + issue to selected members)."
        templates={generalTemplates}
        loading={loading}
        activatingId={activatingId}
        onCalibrate={openCalibrator}
        onActivate={handleActivate}
        onDelete={handleDelete}
        activateLabel="Activate for Issue"
        activeBadge="Active — ready to issue"
      />

      {showCalibrator && calibratorDoc && (
        <ZoneCalibrator
          templateUrl={calibratorDoc._previewObjectUrl || getImgUrl(calibratorDoc.imageUrl || `/api/cert-templates/${calibratorDoc._id}/image`)}
          zones={calibratorDoc.zones}
          canvasWidth={calibratorDoc.canvasWidth || 2048}
          canvasHeight={calibratorDoc.canvasHeight || 1436}
          onSave={async (newZones) => {
            try {
              await api.put(`cert-templates/${previewId}/zones`, { zones: newZones }, auth);
              if (calibratorDoc._previewObjectUrl) URL.revokeObjectURL(calibratorDoc._previewObjectUrl);
              setShowCalibrator(false);
              setCalibratorDoc(null);
              await refreshTemplates();
              const kind = calibratorDoc.kind === 'membership' ? 'membership' : 'general';
              notify(
                kind === 'membership'
                  ? 'Calibration saved. Click Post to Members when ready.'
                  : 'Calibration saved. Activate for Issue when ready.'
              );
            } catch (err) {
              console.error(err);
              notify(err.response?.data?.error || 'Failed to save calibration', 'error');
              throw err;
            }
          }}
          onClose={() => {
            if (calibratorDoc._previewObjectUrl) URL.revokeObjectURL(calibratorDoc._previewObjectUrl);
            setShowCalibrator(false);
            setCalibratorDoc(null);
          }}
        />
      )}
    </div>
  );
}
