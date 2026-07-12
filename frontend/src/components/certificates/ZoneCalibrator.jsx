import { useState } from 'react';

const ZONE_META = {
  name: { label: 'Member Name', color: '#00bcd4' },
  date: { label: 'Issue Date', color: '#22c55e' },
  mobile: { label: 'Mobile', color: '#f97316' },
  memberId: { label: 'Member ID', color: '#3b82f6' },
  joiningYear: { label: 'Joining Year', color: '#a855f7' },
  membershipStatus: { label: 'Status', color: '#ef4444' },
};

const CANVAS_W = 2048;
const CANVAS_H = 1436;

function boxStyle(zone, color) {
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
    border: `2px dashed ${color}`,
    background: `${color}22`,
    cursor: 'move',
    userSelect: 'none',
    boxSizing: 'border-box',
  };
}

export default function ZoneCalibrator({ templateUrl, zones, onSave, onClose }) {
  const [localZones, setLocalZones] = useState(() =>
    JSON.parse(JSON.stringify(zones || {}))
  );
  const [saving, setSaving] = useState(false);
  const [activeKey, setActiveKey] = useState('name');

  const startDrag = (e, key) => {
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

  const updateZoneField = (key, field, value) => {
    setLocalZones((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localZones);
    } finally {
      setSaving(false);
    }
  };

  const zoneKeys = Object.keys(ZONE_META).filter((k) => localZones[k]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-6 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Calibrate Certificate Zones</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Drag each box onto the placeholder. Boxes must not overlap.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="px-6 py-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
          {zoneKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${
                activeKey === key ? 'border-slate-800 bg-slate-50' : 'border-transparent'
              }`}
            >
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ZONE_META[key].color }} />
              {ZONE_META[key].label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-4">
          <div className="relative inline-block w-full select-none">
            <img
              src={templateUrl}
              alt="Certificate template"
              style={{ width: '100%', display: 'block' }}
              draggable={false}
            />
            {zoneKeys.map((key) => {
              const zone = localZones[key];
              if (!zone) return null;
              const color = ZONE_META[key].color;
              return (
                <div
                  key={key}
                  onMouseDown={(e) => startDrag(e, key)}
                  style={boxStyle(zone, color)}
                  title={ZONE_META[key].label}
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
                    {ZONE_META[key].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {activeKey && localZones[activeKey] && (
          <div className="px-6 pb-4">
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <p className="col-span-2 sm:col-span-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                {ZONE_META[activeKey].label} settings
              </p>
              <label className="text-xs text-slate-600">
                Font size
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={localZones[activeKey].fontSize || 28}
                  onChange={(e) => updateZoneField(activeKey, 'fontSize', Number(e.target.value))}
                  className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs text-slate-600">
                Color
                <input
                  type="color"
                  value={localZones[activeKey].color || '#002147'}
                  onChange={(e) => updateZoneField(activeKey, 'color', e.target.value)}
                  className="mt-1 w-full h-9 cursor-pointer"
                />
              </label>
              <label className="text-xs text-slate-600">
                Erase fill
                <input
                  type="color"
                  value={localZones[activeKey].eraseColor || '#F7F3EB'}
                  onChange={(e) => updateZoneField(activeKey, 'eraseColor', e.target.value)}
                  className="mt-1 w-full h-9 cursor-pointer"
                />
              </label>
              <label className="text-xs text-slate-600">
                Align
                <select
                  value={localZones[activeKey].align || 'center'}
                  onChange={(e) => updateZoneField(activeKey, 'align', e.target.value)}
                  className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
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
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Calibration'}
          </button>
        </div>
      </div>
    </div>
  );
}
