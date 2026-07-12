import { useState, useEffect, useRef } from 'react';
import {
  CERT_FIELD_CATALOG,
  ZONE_ACCENT,
  getFieldLabel,
  createDefaultZone,
  autoDetectAllZoneStyles,
  sampleZoneStyleFromImage,
} from '../../utils/certZoneTools';

const CANVAS_W = 2048;
const CANVAS_H = 1436;

function boxStyle(zone, color, selected) {
  const w = zone.maxWidth || 200;
  const h = Math.max(zone.maxHeight || 40, 28);
  let leftPct;
  if (zone.align === 'center') leftPct = ((zone.x - w / 2) / CANVAS_W) * 100;
  else if (zone.align === 'right') leftPct = ((zone.x - w) / CANVAS_W) * 100;
  else leftPct = (zone.x / CANVAS_W) * 100;
  const topPct = ((zone.y - h) / CANVAS_H) * 100;

  return {
    position: 'absolute',
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${(w / CANVAS_W) * 100}%`,
    height: `${(h / CANVAS_H) * 100}%`,
    border: selected ? `2px solid ${color}` : `2px dashed ${color}`,
    background: `${color}22`,
    cursor: 'move',
    userSelect: 'none',
    boxSizing: 'border-box',
    zIndex: selected ? 5 : 2,
  };
}

export default function ZoneCalibrator({
  templateUrl,
  zones,
  canvasWidth = CANVAS_W,
  canvasHeight = CANVAS_H,
  onSave,
  onClose,
}) {
  const [localZones, setLocalZones] = useState(() =>
    JSON.parse(JSON.stringify(zones || {}))
  );
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [activeKey, setActiveKey] = useState(() => Object.keys(zones || {})[0] || 'name');
  const [addKey, setAddKey] = useState('');
  const imgRef = useRef(null);
  const [imgReady, setImgReady] = useState(false);

  const zoneKeys = Object.keys(localZones);
  const availableToAdd = CERT_FIELD_CATALOG.filter((f) => !localZones[f.key]);

  useEffect(() => {
    if (!imgReady || !imgRef.current) return;
    // Auto-detect styles once when image loads (fill missing only)
    setDetecting(true);
    try {
      const next = autoDetectAllZoneStyles(
        imgRef.current,
        localZones,
        canvasWidth,
        canvasHeight,
        { overwrite: false }
      );
      setLocalZones(next);
    } finally {
      setDetecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when image becomes ready
  }, [imgReady]);

  const updateZoneField = (key, field, value) => {
    setLocalZones((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const addZone = () => {
    const key = addKey || availableToAdd[0]?.key;
    if (!key || localZones[key]) return;
    const zone = createDefaultZone(key, canvasWidth, canvasHeight, zoneKeys.length);
    if (imgRef.current) {
      const sampled = sampleZoneStyleFromImage(imgRef.current, zone, canvasWidth, canvasHeight);
      Object.assign(zone, sampled);
    }
    setLocalZones((prev) => ({ ...prev, [key]: zone }));
    setActiveKey(key);
    setAddKey('');
  };

  const removeZone = (key) => {
    setLocalZones((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setActiveKey((prev) => (prev === key ? Object.keys(localZones).find((k) => k !== key) || '' : prev));
  };

  const redetectActive = () => {
    if (!imgRef.current || !activeKey || !localZones[activeKey]) return;
    const sampled = sampleZoneStyleFromImage(
      imgRef.current,
      localZones[activeKey],
      canvasWidth,
      canvasHeight
    );
    setLocalZones((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], ...sampled },
    }));
  };

  const redetectAll = () => {
    if (!imgRef.current) return;
    setDetecting(true);
    try {
      const next = autoDetectAllZoneStyles(
        imgRef.current,
        localZones,
        canvasWidth,
        canvasHeight,
        { overwrite: true }
      );
      setLocalZones(next);
    } finally {
      setDetecting(false);
    }
  };

  const startDrag = (e, key) => {
    if (e.target.dataset.resize) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveKey(key);
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startZone = { ...localZones[key] };

    const onMove = (me) => {
      const dx = ((me.clientX - startX) / rect.width) * CANVAS_W;
      const dy = ((me.clientY - startY) / rect.height) * CANVAS_H;
      setLocalZones((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          x: Math.round(startZone.x + dx),
          y: Math.round(startZone.y + dy),
        },
      }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startResize = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveKey(key);
    const container = e.currentTarget.parentElement.parentElement;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startZone = { ...localZones[key] };

    const onMove = (me) => {
      const dw = ((me.clientX - startX) / rect.width) * CANVAS_W;
      const dh = ((me.clientY - startY) / rect.height) * CANVAS_H;
      const maxWidth = Math.max(80, Math.round(startZone.maxWidth + dw));
      const maxHeight = Math.max(24, Math.round(startZone.maxHeight + dh));
      setLocalZones((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          maxWidth,
          maxHeight,
          fontSize: Math.max(10, Math.min(96, Math.round(maxHeight * 0.58))),
        },
      }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleSave = async () => {
    if (zoneKeys.length === 0) return;
    setSaving(true);
    try {
      await onSave(localZones);
    } finally {
      setSaving(false);
    }
  };

  const active = activeKey ? localZones[activeKey] : null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto flex items-start justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-4 shadow-2xl flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Calibrate Certificate Fields</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Add fields · Resize boxes · Auto color/font from template · Saved permanently
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: field list + add form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add field box</p>
              <div className="flex gap-2">
                <select
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  disabled={availableToAdd.length === 0}
                >
                  {availableToAdd.length === 0 ? (
                    <option value="">All fields added</option>
                  ) : (
                    <>
                      <option value="">Select field…</option>
                      {availableToAdd.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={addZone}
                  disabled={availableToAdd.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#00bcd4] text-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
              {zoneKeys.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">No fields yet. Add at least one.</p>
              ) : (
                zoneKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveKey(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                      activeKey === key ? 'bg-teal-50' : ''
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: ZONE_ACCENT[key] || '#64748b' }}
                    />
                    <span className="flex-1 text-sm font-bold text-slate-700">{getFieldLabel(key)}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeZone(key); }}
                      className="text-rose-400 hover:text-rose-600 text-xs px-2"
                      title="Remove"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </button>
                ))
              )}
            </div>

            {active && (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {getFieldLabel(activeKey)} settings
                  </p>
                  <button
                    type="button"
                    onClick={redetectActive}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#0097a7] hover:underline"
                  >
                    Re-detect from image
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-600 font-semibold">
                    Width
                    <input
                      type="number"
                      min={80}
                      max={canvasWidth}
                      value={active.maxWidth || 200}
                      onChange={(e) => updateZoneField(activeKey, 'maxWidth', Number(e.target.value))}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Height
                    <input
                      type="number"
                      min={24}
                      max={400}
                      value={active.maxHeight || 40}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        updateZoneField(activeKey, 'maxHeight', h);
                        updateZoneField(activeKey, 'fontSize', Math.max(10, Math.min(96, Math.round(h * 0.58))));
                      }}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Font size
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={active.fontSize || 22}
                      onChange={(e) => updateZoneField(activeKey, 'fontSize', Number(e.target.value))}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Align
                    <select
                      value={active.align || 'center'}
                      onChange={(e) => updateZoneField(activeKey, 'align', e.target.value)}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Text color
                    <input
                      type="color"
                      value={active.color || '#002147'}
                      onChange={(e) => updateZoneField(activeKey, 'color', e.target.value)}
                      className="mt-1 w-full h-9 cursor-pointer bg-white rounded-lg"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Erase fill
                    <input
                      type="color"
                      value={active.eraseColor || '#F7F3EB'}
                      onChange={(e) => updateZoneField(activeKey, 'eraseColor', e.target.value)}
                      className="mt-1 w-full h-9 cursor-pointer bg-white rounded-lg"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    X position
                    <input
                      type="number"
                      value={active.x || 0}
                      onChange={(e) => updateZoneField(activeKey, 'x', Number(e.target.value))}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600 font-semibold">
                    Y position
                    <input
                      type="number"
                      value={active.y || 0}
                      onChange={(e) => updateZoneField(activeKey, 'y', Number(e.target.value))}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right: template canvas */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {detecting ? 'Detecting colors…' : 'Drag boxes · Corner handle to resize'}
              </p>
              <button
                type="button"
                onClick={redetectAll}
                disabled={!imgReady || detecting}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
              >
                Auto-detect all from template
              </button>
            </div>
            <div className="relative inline-block w-full select-none rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                ref={imgRef}
                src={templateUrl}
                alt="Certificate template"
                style={{ width: '100%', display: 'block' }}
                draggable={false}
                onLoad={() => setImgReady(true)}
              />
              {zoneKeys.map((key) => {
                const zone = localZones[key];
                if (!zone) return null;
                const color = ZONE_ACCENT[key] || '#64748b';
                const selected = activeKey === key;
                return (
                  <div
                    key={key}
                    onMouseDown={(e) => startDrag(e, key)}
                    style={boxStyle(zone, color, selected)}
                    title={getFieldLabel(key)}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        color,
                        fontWeight: 700,
                        padding: '0 4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getFieldLabel(key)}
                    </span>
                    <div
                      data-resize="1"
                      onMouseDown={(e) => startResize(e, key)}
                      style={{
                        position: 'absolute',
                        right: -4,
                        bottom: -4,
                        width: 14,
                        height: 14,
                        background: color,
                        borderRadius: 3,
                        cursor: 'nwse-resize',
                        border: '2px solid white',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-3 justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {zoneKeys.length} field(s) · Saved forever on this template until you edit again
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || zoneKeys.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Calibration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
