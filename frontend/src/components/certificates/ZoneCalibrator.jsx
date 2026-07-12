import { useState, useEffect, useRef } from 'react';
import {
  CERT_FIELD_CATALOG,
  ZONE_ACCENT,
  getFieldLabel,
  createDefaultZone,
  autoDetectAllZoneStyles,
  sampleZoneStyleFromImage,
  samplePixelAt,
  hexToRgb,
  PREVIEW_SAMPLE_TEXT,
} from '../../utils/certZoneTools';
import { fitZoneFontSize } from '../../utils/canvasEngine';

const CANVAS_W = 2048;
const CANVAS_H = 1436;

const SERIF_FONT = "'Playfair Display', 'Times New Roman', serif";
const SANS_FONT = "'Inter', 'Helvetica Neue', sans-serif";

function boxGeometry(zone) {
  const w = zone.maxWidth || 200;
  const h = Math.max(zone.maxHeight || 40, 28);
  let left;
  if (zone.align === 'center') left = zone.x - w / 2;
  else if (zone.align === 'right') left = zone.x - w;
  else left = zone.x;
  const top = zone.y - h;
  return { left, top, w, h };
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
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [pickMode, setPickMode] = useState(null); // 'color' | 'erase' | null
  const [lastSample, setLastSample] = useState(null);
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const [imgReady, setImgReady] = useState(false);
  /** Display px per canvas px — keeps live preview font identical to Preview Draft */
  const [displayScale, setDisplayScale] = useState(1);

  const zoneKeys = Object.keys(localZones);
  const availableToAdd = CERT_FIELD_CATALOG.filter((f) => !localZones[f.key]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const updateScale = () => {
      const w = el.clientWidth || 0;
      setDisplayScale(w > 0 ? w / CANVAS_W : 1);
    };
    updateScale();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateScale);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [imgReady]);

  useEffect(() => {
    if (!imgReady || !imgRef.current) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      Object.assign(zone, sampleZoneStyleFromImage(imgRef.current, zone, canvasWidth, canvasHeight));
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
      setLocalZones(
        autoDetectAllZoneStyles(imgRef.current, localZones, canvasWidth, canvasHeight, {
          overwrite: true,
        })
      );
    } finally {
      setDetecting(false);
    }
  };

  const applySampleToActive = (target) => {
    if (!lastSample || !activeKey || !localZones[activeKey]) return;
    updateZoneField(activeKey, target === 'erase' ? 'eraseColor' : 'color', lastSample.hex);
  };

  const handleImageClick = (e) => {
    if (!pickMode || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = imgRef.current.getBoundingClientRect();
    const sample = samplePixelAt(imgRef.current, rect, e.clientX, e.clientY, canvasWidth, canvasHeight);
    setLastSample(sample);
    if (activeKey && localZones[activeKey]) {
      updateZoneField(activeKey, pickMode === 'erase' ? 'eraseColor' : 'color', sample.hex);
    }
    setPickMode(null);
  };

  const startDrag = (e, key) => {
    if (pickMode) return;
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
    if (pickMode) return;
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
  const activeRgb = active ? hexToRgb(active.color) : null;
  const eraseRgb = active ? hexToRgb(active.eraseColor) : null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto flex items-start justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-4 shadow-2xl flex flex-col max-h-[96vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Calibrate Certificate Fields</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Eyedropper · Live preview · Resize · Save permanently
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-5 gap-4">
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
                      className="w-3 h-3 rounded-sm shrink-0 border border-slate-200"
                      style={{ backgroundColor: localZones[key]?.color || ZONE_ACCENT[key] }}
                    />
                    <span className="flex-1 text-sm font-bold text-slate-700">{getFieldLabel(key)}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeZone(key); }}
                      className="text-rose-400 hover:text-rose-600 text-xs px-2"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </button>
                ))
              )}
            </div>

            {active && (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {getFieldLabel(activeKey)} settings
                  </p>
                  <button
                    type="button"
                    onClick={redetectActive}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#0097a7] hover:underline"
                  >
                    Auto from box area
                  </button>
                </div>

                {/* Color sampler panel */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Sample color from template
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPickMode(pickMode === 'color' ? null : 'color')}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        pickMode === 'color'
                          ? 'bg-[#002147] text-white border-[#002147]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <i className="fas fa-eye-dropper mr-1" /> Pick text color
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickMode(pickMode === 'erase' ? null : 'erase')}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        pickMode === 'erase'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <i className="fas fa-eye-dropper mr-1" /> Pick erase fill
                    </button>
                  </div>
                  {pickMode && (
                    <p className="text-[11px] text-[#0097a7] font-semibold">
                      Click anywhere on the certificate image to sample RGB…
                    </p>
                  )}
                  {lastSample && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div
                        className="w-12 h-12 rounded-lg border border-slate-200 shrink-0 shadow-inner"
                        style={{ backgroundColor: lastSample.hex }}
                      />
                      <div className="text-xs font-mono text-slate-700 space-y-0.5">
                        <p className="font-bold">{lastSample.hex.toUpperCase()}</p>
                        <p>RGB({lastSample.r}, {lastSample.g}, {lastSample.b})</p>
                      </div>
                      <div className="ml-auto flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => applySampleToActive('color')}
                          className="text-[9px] font-black uppercase tracking-widest text-[#002147] hover:underline"
                        >
                          → Text
                        </button>
                        <button
                          type="button"
                          onClick={() => applySampleToActive('erase')}
                          className="text-[9px] font-black uppercase tracking-widest text-amber-700 hover:underline"
                        >
                          → Erase
                        </button>
                      </div>
                    </div>
                  )}
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
                  <label className="text-xs text-slate-600 font-semibold col-span-2">
                    Font size <span className="text-slate-400 font-normal">(also updates when you resize height)</span>
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
                  <div className="text-xs text-slate-600 font-semibold">
                    Text color
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={active.color || '#002147'}
                        onChange={(e) => updateZoneField(activeKey, 'color', e.target.value)}
                        className="w-10 h-9 cursor-pointer bg-white rounded-lg"
                      />
                      <div className="font-mono text-[10px] text-slate-600 leading-tight">
                        <div>{(active.color || '#002147').toUpperCase()}</div>
                        {activeRgb && <div>RGB({activeRgb.r}, {activeRgb.g}, {activeRgb.b})</div>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-semibold col-span-2">
                    Erase fill
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={active.eraseColor || '#F7F3EB'}
                        onChange={(e) => updateZoneField(activeKey, 'eraseColor', e.target.value)}
                        className="w-10 h-9 cursor-pointer bg-white rounded-lg"
                      />
                      <div className="font-mono text-[10px] text-slate-600 leading-tight">
                        <div>{(active.eraseColor || '#F7F3EB').toUpperCase()}</div>
                        {eraseRgb && <div>RGB({eraseRgb.r}, {eraseRgb.g}, {eraseRgb.b})</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini live style swatch — same canvas font size as Preview Draft */}
                <div
                  className="rounded-xl border border-slate-200 p-4 text-center"
                  style={{ backgroundColor: active.eraseColor || '#F7F3EB' }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Style preview · {active.fontSize || 22}px canvas
                  </p>
                  <p
                    style={{
                      color: active.color || '#002147',
                      fontSize: Math.min(36, active.fontSize || 22),
                      fontFamily: activeKey === 'name' ? SERIF_FONT : SANS_FONT,
                      fontWeight: activeKey === 'name' ? 700 : 600,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {PREVIEW_SAMPLE_TEXT[activeKey] || getFieldLabel(activeKey)}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-2">
                    On template &amp; Preview Draft this size scales with the image
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {pickMode
                  ? `Eyedropper on — click image for ${pickMode === 'erase' ? 'erase' : 'text'} color`
                  : detecting
                    ? 'Detecting colors…'
                    : 'Drag boxes · Corner = resize · Toggle live text preview'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowLivePreview((v) => !v)}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                    showLivePreview
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {showLivePreview ? 'Live preview ON' : 'Live preview OFF'}
                </button>
                <button
                  type="button"
                  onClick={redetectAll}
                  disabled={!imgReady || detecting}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                >
                  Auto-detect all
                </button>
              </div>
            </div>

            <div
              ref={stageRef}
              className={`relative inline-block w-full select-none rounded-xl overflow-hidden border border-slate-200 bg-slate-100 ${
                pickMode ? 'cursor-crosshair ring-2 ring-[#00bcd4]' : ''
              }`}
              onClick={handleImageClick}
            >
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
                const accent = ZONE_ACCENT[key] || '#64748b';
                const selected = activeKey === key;
                const { left, top, w, h } = boxGeometry(zone);
                const sample = PREVIEW_SAMPLE_TEXT[key] || getFieldLabel(key);
                const fontFamily = key === 'name' ? SERIF_FONT : SANS_FONT;
                // Exact same fitted canvas font as Preview Draft / PDF, scaled to on-screen image
                const canvasFont = showLivePreview
                  ? fitZoneFontSize(sample, zone, fontFamily)
                  : (zone.fontSize || 22);
                const screenFont = Math.max(1, canvasFont * displayScale);

                return (
                  <div
                    key={key}
                    onMouseDown={(e) => startDrag(e, key)}
                    style={{
                      position: 'absolute',
                      left: `${(left / CANVAS_W) * 100}%`,
                      top: `${(top / CANVAS_H) * 100}%`,
                      width: `${(w / CANVAS_W) * 100}%`,
                      height: `${(h / CANVAS_H) * 100}%`,
                      border: selected ? `2px solid ${accent}` : `2px dashed ${accent}`,
                      background: showLivePreview
                        ? (zone.eraseColor || '#F7F3EB')
                        : `${accent}22`,
                      cursor: pickMode ? 'crosshair' : 'move',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      zIndex: selected ? 5 : 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        zone.align === 'left' ? 'flex-start'
                          : zone.align === 'right' ? 'flex-end'
                            : 'center',
                      overflow: 'hidden',
                      padding: 0,
                    }}
                    title={`${getFieldLabel(key)} · ${canvasFont}px`}
                  >
                    {showLivePreview ? (
                      <span
                        style={{
                          color: zone.color || '#002147',
                          fontSize: `${screenFont}px`,
                          fontFamily,
                          fontWeight: key === 'name' ? 700 : 600,
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'clip',
                        }}
                      >
                        {sample}
                      </span>
                    ) : (
                      <span style={{ fontSize: 9, color: accent, fontWeight: 700 }}>
                        {getFieldLabel(key)}
                      </span>
                    )}
                    <div
                      data-resize="1"
                      onMouseDown={(e) => startResize(e, key)}
                      style={{
                        position: 'absolute',
                        right: -4,
                        bottom: -4,
                        width: 14,
                        height: 14,
                        background: accent,
                        borderRadius: 3,
                        cursor: 'nwse-resize',
                        border: '2px solid white',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              Live preview uses the same canvas font size as Preview Draft / PDF (scaled to this image).
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-3 justify-between items-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {zoneKeys.length} field(s) · Calibration saved forever on this template
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
