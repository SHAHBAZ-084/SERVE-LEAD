const fs = require('fs');

const file = 'f:/sls-main/sls-main/frontend/src/pages/AdminPortal.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '// ── Customization Tab (SUPERUSER ONLY) ──────────────────';
const endStr = '    // ── Settings Tab (SELF-MANAGEMENT) ───────────────────────';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end index');
    process.exit(1);
}

// Extract old code just in case
const oldCustomizationCode = content.substring(startIndex, endIndex);

const newComponentCode = `// ── Customization Tab (SUPERUSER ONLY) ──────────────────
const CustomizationTabComponent = ({ auth, notify, getImgUrl, inputCls, api }) => {
    const [activeSubTab, setActiveSubTab] = useState("donation");
    const [channels, setChannels] = useState([]);
    const [teamStructure, setTeamStructure] = useState([]);
    const [leadership, setLeadership] = useState({ name: "", role: "", program: "", desc: "", img: "" });
    const [submitting, setSubmitting] = useState(false);

    const PAK_BANKS = [
        "Meezan Bank", "Habib Bank Limited (HBL)", "United Bank Limited (UBL)", 
        "Allied Bank Limited (ABL)", "MCB Bank", "Bank Alfalah", "Bank of Punjab (BOP)", 
        "Askari Bank", "Faysal Bank", "National Bank of Pakistan (NBP)", 
        "Dubai Islamic Bank", "Standard Chartered", "Habib Metro", "Soneri Bank", 
        "Al Baraka Bank", "Bank Al Habib", "JS Bank", "Samba Bank", "Silk Bank", 
        "Summit Bank", "Sindh Bank", "SadaPay", "NayaPay"
    ];

    useEffect(() => {
        api.get("settings").then(r => {
            if (r.data.donation_channels) {
                try { setChannels(JSON.parse(r.data.donation_channels)); } catch { setChannels([]); }
            }
            if (r.data.team_structure) {
                try { setTeamStructure(JSON.parse(r.data.team_structure)); } catch { setTeamStructure([]); }
            }
            if (r.data.team_leadership) {
                try { setLeadership(JSON.parse(r.data.team_leadership)); } catch { setLeadership({ name: "", role: "", program: "", desc: "", img: "" }); }
            }
        });
    }, [api]);

    const save = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await api.put("settings", { 
                donation_channels: JSON.stringify(channels),
                team_structure: JSON.stringify(teamStructure),
                team_leadership: JSON.stringify(leadership)
            }, auth);
            notify("System customization updated successfully!");
        } catch { notify("Failed to update settings", "error"); }
        finally { setSubmitting(false); }
    };

    const addChannel = (type) => {
        const newChannel = type === 'Bank' 
            ? { id: Date.now(), type: 'Bank', bankName: PAK_BANKS[0], iban: "", accountNumber: "" }
            : { id: Date.now(), type: 'Wallet', walletType: 'EasyPaisa', number: "" };
        setChannels([...channels, newChannel]);
    };

    const updateChannel = (id, field, value) => {
        setChannels(channels.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeChannel = (id) => setChannels(channels.filter(c => c.id !== id));

    const addCategory = () => setTeamStructure([...teamStructure, { id: Date.now(), name: "N/A Category", members: [] }]);
    const updateCategory = (id, name) => setTeamStructure(teamStructure.map(c => c.id === id ? { ...c, name } : c));
    const removeCategory = (id) => setTeamStructure(teamStructure.filter(c => c.id !== id));

    const addMember = (catId) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: [...c.members, { id: Date.now(), name: "Full Name", role: "Role", program: "Program", desc: "Bio", img: "" }]
        } : c));
    };

    const updateMember = (catId, memberId, field, value) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: c.members.map(m => m.id === memberId ? { ...m, [field]: value } : m)
        } : c));
    };

    const removeMember = (catId, memberId) => {
        setTeamStructure(teamStructure.map(c => c.id === catId ? {
            ...c, members: c.members.filter(m => m.id !== memberId)
        } : c));
    };

    const uploadPhoto = async (catId, memberId, file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const r = await api.post('settings/upload', formData, auth);
            if (catId === 'leadership') setLeadership({ ...leadership, img: r.data.imageUrl });
            else updateMember(catId, memberId, 'img', r.data.imageUrl);
            notify("Member photo uploaded!");
        } catch { notify("Photo upload failed", "error"); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-up pb-20">
            {/* Sub-Navigation Buttons */}
            <div className="flex gap-4 p-2 bg-slate-200/50 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveSubTab("donation")}
                    className={\`py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all \${
                        activeSubTab === "donation" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }\`}
                >
                    <i className="fas fa-money-check-dollar mr-2"></i> Donation Channels
                </button>
                <button 
                    onClick={() => setActiveSubTab("team")}
                    className={\`py-2.5 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all \${
                        activeSubTab === "team" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }\`}
                >
                    <i className="fas fa-users-gear mr-2"></i> Team Management
                </button>
            </div>

            {activeSubTab === "donation" && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
                    <div className="p-8 md:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                    <i className="fas fa-screwdriver-wrench" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Donation Channels</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Global Financial Overrides</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => addChannel('Wallet')} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
                                    + Add Wallet
                                </button>
                                <button type="button" onClick={() => addChannel('Bank')} className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all">
                                    + Add Bank
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {channels.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <i className="fas fa-plus-circle text-slate-200 text-3xl mb-3 block" />
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No channels configured</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-6">
                                {channels.map((ch) => (
                                    <div key={ch.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200/60 relative group animate-fade-up">
                                        <button type="button" onClick={() => removeChannel(ch.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-2">
                                            <i className="fas fa-trash-alt text-sm" />
                                        </button>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={\`w-8 h-8 rounded-lg flex items-center justify-center text-xs \${ch.type === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}\`}>
                                                <i className={\`fas \${ch.type === 'Bank' ? 'fa-building-columns' : 'fa-mobile-screen'}\`} />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{ch.type} Channel</span>
                                        </div>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {ch.type === 'Wallet' ? (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Wallet Type</label>
                                                        <select value={ch.walletType} onChange={e => updateChannel(ch.id, 'walletType', e.target.value)} className={inputCls}>
                                                            <option>EasyPaisa</option><option>JazzCash</option><option>SadaPay</option><option>NayaPay</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">11-Digit Account Number</label>
                                                        <input type="text" maxLength={11} placeholder="03XXXXXXXXX" value={ch.number} onChange={e => updateChannel(ch.id, 'number', e.target.value)} className={inputCls} required />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Bank</label>
                                                        <select value={ch.bankName} onChange={e => updateChannel(ch.id, 'bankName', e.target.value)} className={inputCls}>
                                                            {PAK_BANKS.map(b => <option key={b}>{b}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Account Number</label>
                                                        <input type="text" placeholder="Account #" value={ch.accountNumber} onChange={e => updateChannel(ch.id, 'accountNumber', e.target.value)} className={inputCls} required />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">IBAN Number</label>
                                                        <input type="text" placeholder="PK24XXXX..." value={ch.iban} onChange={e => updateChannel(ch.id, 'iban', e.target.value)} className={inputCls} required />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === "team" && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-700" />
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                    <i className="fas fa-user-shield" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Society Leadership</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Chairman / Principal Figure</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group flex-shrink-0">
                                    {leadership.img ? <img src={getImgUrl(leadership.img)} className="w-full h-full object-cover" /> : 
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-black uppercase">{leadership.name?.charAt(0) || "L"}</div>}
                                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <i className="fas fa-camera text-white text-lg" />
                                        <input type="file" className="hidden" accept="image/*" onChange={e => uploadPhoto('leadership', null, e.target.files[0])} />
                                    </label>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                                        <input type="text" value={leadership.name} onChange={e => setLeadership({...leadership, name: e.target.value})} className={inputCls} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Primary Title</label>
                                        <input type="text" value={leadership.role} onChange={e => setLeadership({...leadership, role: e.target.value})} className={inputCls} />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Professional Bio</label>
                                        <textarea rows={2} value={leadership.desc} onChange={e => setLeadership({...leadership, desc: e.target.value})} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600" />
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                        <i className="fas fa-users-gear" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Team Hierarchy</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Society Chapters & Core Members</p>
                                    </div>
                                </div>
                                <button type="button" onClick={addCategory} className="px-5 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all">
                                    + Add Category
                                </button>
                            </div>

                            <div className="space-y-10">
                                {teamStructure.map((cat) => (
                                    <div key={cat.id} className="space-y-6">
                                        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                                            <input type="text" value={cat.name} onChange={e => updateCategory(cat.id, e.target.value)} 
                                                className="text-xs font-black text-slate-400 hover:text-purple-600 transition-colors uppercase tracking-[0.2em] bg-transparent border-none focus:ring-0 p-0" />
                                            <button type="button" onClick={() => addMember(cat.id)} className="ml-auto text-[10px] font-black uppercase text-purple-600 hover:underline">Add Member</button>
                                            <button type="button" onClick={() => removeCategory(cat.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-1"><i className="fas fa-trash-alt text-xs" /></button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {cat.members.map((m) => (
                                                <div key={m.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative group flex gap-6 items-center">
                                                    <button type="button" onClick={() => removeMember(cat.id, m.id)} className="absolute top-2 right-2 text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-times" /></button>
                                                    
                                                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden relative group/img flex-shrink-0">
                                                        {m.img ? <img src={getImgUrl(m.img)} className="w-full h-full object-cover" /> : 
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl"><i className="fas fa-user" /></div>}
                                                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                                            <i className="fas fa-camera text-white text-xs" />
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => uploadPhoto(cat.id, m.id, e.target.files[0])} />
                                                        </label>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                        <input type="text" placeholder="Full Name" value={m.name} onChange={e => updateMember(cat.id, m.id, 'name', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <input type="text" placeholder="Designation" value={m.role} onChange={e => updateMember(cat.id, m.id, 'role', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <input type="text" placeholder="Program/Field" value={m.program} onChange={e => updateMember(cat.id, m.id, 'program', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                        <textarea placeholder="Bio description..." rows={1} value={m.desc} onChange={e => updateMember(cat.id, m.id, 'desc', e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Actions */}
            <button type="button" onClick={save} disabled={submitting} 
                className="w-full bg-[#002147] text-white py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50">
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="fas fa-cloud-arrow-up" />}
                Apply All System Changes
            </button>
        </div>
    );
};
    // ── Settings Tab (SELF-MANAGEMENT) ───────────────────────`;

// Perform the replacement
content = content.substring(0, startIndex) + "    " + endStr + "\n" + content.substring(endIndex + endStr.length);

// Also need to inject the CustomizationTabComponent outside AdminPortal
const insertPoint = content.indexOf('export default function AdminPortal() {');
content = content.substring(0, insertPoint) + newComponentCode + "\n\n" + content.substring(insertPoint);

// Also update the rendering
content = content.replace('{isSuper && activeTab === "customization" && <CustomizationTab />}', 
    '{isSuper && activeTab === "customization" && <CustomizationTabComponent auth={auth} notify={notify} getImgUrl={getImgUrl} inputCls={inputCls} api={api} />}');

fs.writeFileSync(file, content);
console.log('Successfully completed!');
