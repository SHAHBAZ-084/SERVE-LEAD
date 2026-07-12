import { useState } from 'react';

const ZONE_COLORS = {
  name: '#00bcd4',
  memberId: '#3b82f6',
  date: '#22c55e',
  city: '#f97316',
};

const CANVAS_W = 2048;
const CANVAS_H = 1436;

export default function ZoneCalibrator({ templateUrl, zones, onSave, onClose }) {
  const [localZones, setLocalZones] = useState(() =>
    JSON.parse(JSON.stringify(zones || {}))
  );
  const [saving, setSaving] = useState(false);

  const startDrag = (e, key) => {
    e.preventDefault();
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

  const zoneKeys = Object.keys(localZones);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-6 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Calibrate Certificate Zones</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="px-6 py-3 flex flex-wrap gap-4 text-xs font-semibold">
          {Object.entries(ZONE_COLORS).map(([key, color]) => (
            <span key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {key}
            </span>
          ))}
        </div>

        <div className="px-6 pb-4">
          <div className="relative inline-block w-full">
            <img
              src={templateUrl}
              alt="Certificate template"
              style={{ width: '100%', display: 'block' }}
              draggable={false}
            />
            {zoneKeys.map((key) => {
              const zone = localZones[key];
              if (!zone) return null;
              return (
                <div
                  key={key}
                  onMouseDown={(e) => startDrag(e, key)}
                  style={{
                    position: 'absolute',
                    left: `${(zone.x / CANVAS_W) * 100}%`,
                    top: `${(zone.y / CANVAS_H) * 100}%`,
                    width: `${((zone.maxWidth || 200) / CANVAS_W) * 100}%`,
                    border: `2px dashed ${ZONE_COLORS[key] || '#00bcd4'}`,
                    cursor: 'move',
                    userSelect: 'none',
                    padding: '2px 4px',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255,255,255,0.15)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: ZONE_COLORS[key] || '#00bcd4',
                      fontWeight: 600,
                    }}
                  >
                    {key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {zoneKeys.map((key) => (
            <div key={key} className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{key}</p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-600">Font size</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={localZones[key].fontSize || 28}
                  onChange={(e) =>
                    updateZoneField(key, 'fontSize', Number(e.target.value))
                  }
                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm"
                />
                <label className="text-xs text-slate-600">Color</label>
                <input
                  type="color"
                  value={localZones[key].color || '#ffffff'}
                  onChange={(e) => updateZoneField(key, 'color', e.target.value)}
                  className="w-10 h-8 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

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
