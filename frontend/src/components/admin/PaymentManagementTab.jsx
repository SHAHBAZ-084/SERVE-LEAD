import { useState, useEffect, useCallback } from "react";
import { getImgUrl } from "../../api";

const ACTION_BADGE = {
  fee_requested: "bg-blue-100 text-blue-700 border-blue-200",
  fee_submitted: "bg-amber-100 text-amber-700 border-amber-200",
  fee_verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fee_rejected: "bg-rose-100 text-rose-700 border-rose-200",
  fee_waived: "bg-purple-100 text-purple-700 border-purple-200",
  donation_received: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export const getInterviewBadge = (m) => {
  const rs = m.interviewResult?.status;
  if (rs === "passed") return { label: "Interview Passed ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (rs === "failed") return { label: "Interview Failed", cls: "bg-rose-100 text-rose-700 border-rose-200" };
  if (m.interview_called) return { label: "Awaiting Interview Result", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return null;
};

export const getFeeApprovalBadge = (m) => {
  const ib = getInterviewBadge(m);
  if (ib && m.interviewResult?.status === "failed") return ib;
  if (m.interviewResult?.status !== "passed") {
    if (m.interview_called) return { label: "Interview Pending Result", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    return null;
  }
  if (m.feeStatus === "requested") return { label: "Fee Requested — Awaiting Member", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (m.feeStatus === "submitted") return { label: "Proof Submitted", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  if (m.feeStatus === "verified") return { label: "Fee Verified ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (m.feeStatus === "waived") return { label: "Fee Waived ✓", cls: "bg-purple-100 text-purple-700 border-purple-200" };
  if (m.feeStatus === "not_requested") return { label: "Fee Not Requested", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return null;
};

export const canApproveMemberFee = (m) =>
  m.interviewResult?.status === "passed" && (m.feeStatus === "verified" || m.feeStatus === "waived");

export const needsInterviewResult = (m) =>
  m.interview_called && m.interviewResult?.status !== "passed" && m.interviewResult?.status !== "failed";

export const canRequestFee = (m) =>
  m.interviewResult?.status === "passed" && m.feeStatus === "not_requested";

export const canDirectApprove = (m) =>
  m.interviewResult?.status === "passed" && !canApproveMemberFee(m);

const PAK_BANKS = ["Allied Bank", "Askari Bank", "Bank Alfalah", "Bank Al-Habib", "Faysal Bank", "HBL", "JS Bank", "MCB", "Meezan Bank", "National Bank", "Standard Chartered", "UBL"];

const PaymentManagementTab = ({ pendingMembers, fetchPendingMembers, auth, notify, api, Spinner, inputCls }) => {
  const [subView, setSubView] = useState("pending");
  const [showFeeSettings, setShowFeeSettings] = useState(false);
  const [membershipValidityMonths, setMembershipValidityMonths] = useState("12");
  const [defaultFeeDeadlineDays, setDefaultFeeDeadlineDays] = useState("7");
  const [feeChannels, setFeeChannels] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [membershipFee, setMembershipFee] = useState(0);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [feeDeadline, setFeeDeadline] = useState("");
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [waiveReason, setWaiveReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedProof, setExpandedProof] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [donationForm, setDonationForm] = useState({ donorName: "", amount: "", paymentChannel: "", transactionId: "", note: "" });

  const passedMembers = (pendingMembers || []).filter((m) => m.interviewResult?.status === "passed");

  const actionMembers = passedMembers.filter((m) => {
    const needsRequest = m.feeStatus === "not_requested";
    const needsReview = m.feeStatus === "submitted";
    const needsVerifyWaived = m.feeStatus === "waived";
    return needsRequest || needsReview || needsVerifyWaived;
  });

  const fetchRecords = useCallback(async (type) => {
    setRecordsLoading(true);
    try {
      const r = await api.get(`fees/records?recordType=${type}&page=${recordsPage}&limit=20`, auth);
      setRecords(r.data.records || []);
      setRecordsTotalPages(r.data.totalPages || 1);
    } catch {
      notify("Failed to load records", "error");
    } finally {
      setRecordsLoading(false);
    }
  }, [api, auth, recordsPage, notify]);

  useEffect(() => {
    api.get("settings").then((r) => {
      setMembershipFee(Number(r.data.membership_fee) || 0);
      setMembershipValidityMonths(String(r.data.membership_validity_months || "12"));
      setDefaultFeeDeadlineDays(String(r.data.default_fee_deadline_days || "7"));
      if (r.data.membership_fee_channels) {
        try { setFeeChannels(JSON.parse(r.data.membership_fee_channels)); } catch { setFeeChannels([]); }
      }
      const days = Number(r.data.default_fee_deadline_days) || 7;
      const d = new Date();
      d.setDate(d.getDate() + days);
      setFeeDeadline(d.toISOString().slice(0, 16));
    }).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (subView === "membership") fetchRecords("membership_fee");
    if (subView === "donations") fetchRecords("donation");
  }, [subView, fetchRecords]);

  const handleRequestFee = async (memberId) => {
    setProcessing(true);
    try {
      const r = await api.post(`fees/request/${memberId}`, { deadline: feeDeadline }, auth);
      notify(r.data.message || "Fee request sent");
      setConfirmRequest(null);
      fetchPendingMembers();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to request fee", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleWaive = async (e) => {
    e.preventDefault();
    if (!waiveTarget || waiveReason.trim().length < 10) {
      notify("Waiver reason must be at least 10 characters", "error");
      return;
    }
    setProcessing(true);
    try {
      await api.post(`fees/waive/${waiveTarget._id}`, { reason: waiveReason.trim() }, auth);
      notify("Membership fee waived");
      setWaiveTarget(null);
      setWaiveReason("");
      fetchPendingMembers();
    } catch (err) {
      notify(err.response?.data?.error || "Failed to waive fee", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async (memberId) => {
    setProcessing(true);
    try {
      const r = await api.post(`fees/verify/${memberId}`, {}, auth);
      notify(r.data.message || "Fee verified");
      fetchPendingMembers();
    } catch (err) {
      notify(err.response?.data?.error || "Verification failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) {
      notify("Rejection reason is required", "error");
      return;
    }
    setProcessing(true);
    try {
      await api.post(`fees/reject/${rejectTarget._id}`, { reason: rejectReason.trim() }, auth);
      notify("Fee submission rejected. Member notified.");
      setRejectTarget(null);
      setRejectReason("");
      fetchPendingMembers();
    } catch (err) {
      notify(err.response?.data?.error || "Rejection failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleLogDonation = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.post("fees/donation", {
        donorName: donationForm.donorName.trim(),
        amount: Number(donationForm.amount),
        paymentChannel: donationForm.paymentChannel.trim(),
        transactionId: donationForm.transactionId.trim(),
        note: donationForm.note.trim(),
      }, auth);
      notify("Donation recorded");
      setDonationForm({ donorName: "", amount: "", paymentChannel: "", transactionId: "", note: "" });
      if (subView === "donations") fetchRecords("donation");
    } catch (err) {
      notify(err.response?.data?.error || "Failed to log donation", "error");
    } finally {
      setProcessing(false);
    }
  };

  const roleLabel = (m) => (m.requestedRole || m.role) === "Executive" ? "Executive" : "General";

  const addFeeChannel = (type) => {
    setFeeChannels([...feeChannels, { id: Date.now(), type, ...(type === "Wallet" ? { walletType: "EasyPaisa", number: "" } : { bankName: PAK_BANKS[0], accountNumber: "", iban: "" }) }]);
  };
  const updateFeeChannel = (id, field, value) => setFeeChannels(feeChannels.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const removeFeeChannel = (id) => setFeeChannels(feeChannels.filter((c) => c.id !== id));

  const handleSaveMembershipSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("fees/membership-settings", {
        membership_fee: membershipFee,
        membership_fee_channels: JSON.stringify(feeChannels),
        membership_validity_months: membershipValidityMonths,
        default_fee_deadline_days: defaultFeeDeadlineDays,
      }, auth);
      notify("Membership payment settings saved");
      const days = Number(defaultFeeDeadlineDays) || 7;
      const d = new Date();
      d.setDate(d.getDate() + days);
      setFeeDeadline(d.toISOString().slice(0, 16));
    } catch (err) {
      notify(err.response?.data?.error || "Failed to save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Management</h2>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Membership fees & donations — separate records</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "pending", label: "Pending Actions" },
            { id: "membership", label: "Membership Fees" },
            { id: "donations", label: "Donations" },
          ].map(({ id, label }) => (
            <button key={id} type="button" onClick={() => { setSubView(id); setRecordsPage(1); }} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${subView === id ? "bg-white text-[#002147] shadow-sm" : "text-slate-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <button type="button" onClick={() => setShowFeeSettings(!showFeeSettings)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
          <div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Membership Fee Settings</p>
            <p className="text-xs text-slate-500 mt-1">Amount: PKR {membershipFee || 0} · Deadline: {defaultFeeDeadlineDays} days · Channels: {feeChannels.length}</p>
          </div>
          <i className={`fas fa-chevron-${showFeeSettings ? "up" : "down"} text-slate-400`} />
        </button>
        {showFeeSettings && (
          <div className="px-6 pb-6 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fee Amount (PKR)</label>
                <input type="number" min="0" value={membershipFee} onChange={(e) => setMembershipFee(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Validity (Months)</label>
                <input type="number" min="1" value={membershipValidityMonths} onChange={(e) => setMembershipValidityMonths(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Default Deadline (Days)</label>
                <input type="number" min="1" value={defaultFeeDeadlineDays} onChange={(e) => setDefaultFeeDeadlineDays(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Methods (emailed to members)</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addFeeChannel("Wallet")} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">+ Wallet</button>
                  <button type="button" onClick={() => addFeeChannel("Bank")} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">+ Bank</button>
                </div>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {feeChannels.length === 0 && <p className="text-xs text-slate-400 italic">No channels configured — donation channels used as fallback.</p>}
                {feeChannels.map((ch) => (
                  <div key={ch.id} className="p-4 bg-slate-50 rounded-xl border relative">
                    <button type="button" onClick={() => removeFeeChannel(ch.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><i className="fas fa-trash-alt text-xs" /></button>
                    {ch.type === "Wallet" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <select value={ch.walletType} onChange={(e) => updateFeeChannel(ch.id, "walletType", e.target.value)} className={inputCls}><option>EasyPaisa</option><option>JazzCash</option><option>SadaPay</option></select>
                        <input placeholder="Number" value={ch.number} onChange={(e) => updateFeeChannel(ch.id, "number", e.target.value)} className={inputCls} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        <select value={ch.bankName} onChange={(e) => updateFeeChannel(ch.id, "bankName", e.target.value)} className={inputCls}>{PAK_BANKS.map((b) => <option key={b}>{b}</option>)}</select>
                        <input placeholder="Account #" value={ch.accountNumber} onChange={(e) => updateFeeChannel(ch.id, "accountNumber", e.target.value)} className={inputCls} />
                        <input placeholder="IBAN" value={ch.iban} onChange={(e) => updateFeeChannel(ch.id, "iban", e.target.value)} className={inputCls} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button type="button" disabled={savingSettings} onClick={handleSaveMembershipSettings} className="px-6 py-3 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      {subView === "pending" && (
        <div className="space-y-4">
          {actionMembers.length === 0 ? (
            <div className="text-center py-20 text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <i className="fas fa-money-check-alt text-5xl mb-4 block opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">No payment actions pending</p>
              <p className="text-xs text-slate-400 mt-2">Members must pass interview before fee can be requested</p>
            </div>
          ) : actionMembers.map((m) => {
            const fp = m.feePayment || {};
            return (
              <div key={m._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{m.name} <span className="text-[10px] text-purple-600 uppercase">({roleLabel(m)})</span></h3>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  {getFeeApprovalBadge(m) && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getFeeApprovalBadge(m).cls}`}>{getFeeApprovalBadge(m).label}</span>
                  )}
                </div>

                {m.feeStatus === "not_requested" && (
                  <div className="flex flex-wrap gap-3">
                    {confirmRequest === m._id ? (
                      <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                        <p className="text-sm text-slate-700">Request <strong>PKR {membershipFee || "—"}</strong> membership fee. Member will be emailed with payment deadline.</p>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Payment Deadline</label>
                          <input type="datetime-local" value={feeDeadline} onChange={(e) => setFeeDeadline(e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={processing} onClick={() => handleRequestFee(m._id)} className="px-4 py-2 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Confirm & Send</button>
                          <button type="button" onClick={() => setConfirmRequest(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setConfirmRequest(m._id)} className="px-5 py-2.5 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Request Fee Payment</button>
                        <button type="button" onClick={() => { setWaiveTarget(m); setWaiveReason(""); }} className="px-5 py-2.5 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Grant Free Membership</button>
                      </>
                    )}
                  </div>
                )}

                {(m.feeStatus === "submitted" || m.feeStatus === "waived") && (
                  <div className="space-y-4">
                    {m.feeStatus === "submitted" && (
                      <>
                        <button type="button" onClick={() => setExpandedProof(expandedProof === m._id ? null : m._id)} className="text-[10px] font-black uppercase tracking-widest text-[#002147] flex items-center gap-2">
                          <i className={`fas fa-chevron-${expandedProof === m._id ? "up" : "down"}`} /> View Proof
                        </button>
                        {expandedProof === m._id && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                            <div className="space-y-2">
                              <p><span className="font-bold text-slate-500">TID:</span> {fp.transactionId || "—"}</p>
                              <p><span className="font-bold text-slate-500">Channel:</span> {fp.paymentChannel || "—"}</p>
                              <p><span className="font-bold text-slate-500">Sender:</span> {fp.accountNumber || "—"}</p>
                              <p><span className="font-bold text-slate-500">Deadline:</span> {fp.deadline ? new Date(fp.deadline).toLocaleString() : "—"}</p>
                            </div>
                            {fp.screenshotUrl && (
                              <button type="button" onClick={() => setLightboxUrl(getImgUrl(fp.screenshotUrl))}>
                                <img src={getImgUrl(fp.screenshotUrl)} alt="Proof" className="max-h-48 rounded-xl border object-contain w-full bg-white" />
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button type="button" disabled={processing} onClick={() => handleVerify(m._id)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Verify Payment</button>
                      {m.feeStatus === "submitted" && (
                        <button type="button" onClick={() => { setRejectTarget(m); setRejectReason(""); }} className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subView === "donations" && (
        <div className="space-y-6">
          <form onSubmit={handleLogDonation} className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="md:col-span-2 text-sm font-black text-slate-800 uppercase tracking-widest">Log New Donation</h3>
            <input placeholder="Donor name" value={donationForm.donorName} onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })} className={inputCls} required />
            <input type="number" min="1" placeholder="Amount (PKR)" value={donationForm.amount} onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })} className={inputCls} required />
            <input placeholder="Payment channel" value={donationForm.paymentChannel} onChange={(e) => setDonationForm({ ...donationForm, paymentChannel: e.target.value })} className={inputCls} />
            <input placeholder="Transaction ID" value={donationForm.transactionId} onChange={(e) => setDonationForm({ ...donationForm, transactionId: e.target.value })} className={inputCls} />
            <textarea placeholder="Note" rows={2} value={donationForm.note} onChange={(e) => setDonationForm({ ...donationForm, note: e.target.value })} className={`${inputCls} md:col-span-2 resize-none`} />
            <button type="submit" disabled={processing} className="md:col-span-2 py-3 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Record Donation</button>
          </form>
        </div>
      )}

      {(subView === "membership" || subView === "donations") && (
        recordsLoading ? <Spinner /> : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{subView === "donations" ? "Donor" : "Member"}</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Channel</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">TID</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Admin</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-16 text-slate-400 text-xs font-bold uppercase">No records</td></tr>
                    ) : records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold">{rec.donorName || rec.memberName || "—"}</td>
                        <td className="px-4 py-3"><span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${ACTION_BADGE[rec.action] || ""}`}>{rec.action?.replace(/_/g, " ")}</span></td>
                        <td className="px-4 py-3">{rec.amount != null ? `PKR ${rec.amount}` : "—"}</td>
                        <td className="px-4 py-3">{rec.paymentChannel || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{rec.transactionId || "—"}</td>
                        <td className="px-4 py-3 text-xs">{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-xs">{rec.adminName || "—"}</td>
                        <td className="px-4 py-3">{rec.screenshotUrl ? <button type="button" onClick={() => setLightboxUrl(getImgUrl(rec.screenshotUrl))} className="text-[10px] font-black uppercase text-[#002147]">View</button> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" disabled={recordsPage <= 1} onClick={() => setRecordsPage((p) => p - 1)} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-xs font-bold text-slate-500">Page {recordsPage} / {recordsTotalPages}</span>
              <button type="button" disabled={recordsPage >= recordsTotalPages} onClick={() => setRecordsPage((p) => p + 1)} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          </>
        )
      )}

      {waiveTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleWaive} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Grant Free Membership</h3>
            <p className="text-sm text-slate-500">Waive fee for <strong>{waiveTarget.name}</strong> ({roleLabel(waiveTarget)})</p>
            <textarea rows={4} value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} placeholder="Reason (min 10 chars)" className={inputCls} required minLength={10} />
            <div className="flex gap-3">
              <button type="submit" disabled={processing} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Confirm</button>
              <button type="button" onClick={() => setWaiveTarget(null)} className="px-4 py-3 border rounded-xl text-[10px] font-black uppercase text-slate-500">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleReject} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Reject Fee Submission</h3>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={inputCls} required />
            <div className="flex gap-3">
              <button type="submit" disabled={processing} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Reject & Notify</button>
              <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-3 border rounded-xl text-[10px] font-black uppercase text-slate-500">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80" onClick={() => setLightboxUrl(null)} role="presentation">
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-white text-2xl"><i className="fas fa-times" /></button>
          <img src={lightboxUrl} alt="Screenshot" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default PaymentManagementTab;
