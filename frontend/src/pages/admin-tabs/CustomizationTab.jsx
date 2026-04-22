import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';

const CustomizationTab = () => {
    const { notify } = useNotification();
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            notify("Settings saved successfully!");
            setSaving(false);
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Portal Customization</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Primary Branding Color</label>
                        <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#002147] border-4 border-white shadow-lg ring-2 ring-[#002147]" />
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 cursor-pointer" />
                            <div className="w-12 h-12 rounded-xl bg-slate-900 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">System Mode</label>
                        <div className="flex gap-4">
                            <button className="flex-1 p-4 bg-[#002147] text-white rounded-2xl font-bold border-2 border-[#002147]">High Contrast (Legacy)</button>
                            <button className="flex-1 p-4 bg-white text-slate-400 rounded-2xl font-bold border-2 border-slate-100">Modern Glass (Dynamic)</button>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-50">
                        <button onClick={handleSave} disabled={saving} className="bg-[#002147] text-white px-10 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationTab;
