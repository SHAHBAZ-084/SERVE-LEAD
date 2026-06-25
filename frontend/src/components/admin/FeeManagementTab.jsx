import { useState, useEffect, useCallback } from "react";
import { getImgUrl } from "../../api";

const adminFilterSelectCls =
  "bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#002147] min-w-[140px]";

const ACTION_BADGE = {
  fee_requested: "bg-blue-100 text-blue-700 border-blue-200",
  fee_submitted: "bg-amber-100 text-amber-700 border-amber-200",
  fee_verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fee_rejected: "bg-rose-100 text-rose-700 border-rose-200",
  fee_waived: "bg-purple-100 text-purple-700 border-purple-200",
};

export const getFeeCardBadge = (m) => {
  if (m.feeStatus === "verified") return { label: "Fee Verified — Ready to Approve", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (m.feeStatus === "waived") return { label: "Fee Waived", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (m.feeStatus === "submitted") return { label: "Proof Submitted — Review Required", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (m.interview_called && m.feeStatus === "not_requested") return { label: "Awaiting Fee Request", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return null;
};

export const getFeeApprovalBadge = (m) => {
  if (!m.interview_called && m.feeStatus === "not_requested") return null;
  if (m.feeStatus === "not_requested" && m.interview_called) return { label: "Fee Not Requested", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  if (m.feeStatus === "requested") return { label: "Fee Requested — Awaiting Member", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (m.feeStatus === "submitted") return { label: "Proof Submitted", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  if (m.feeStatus === "verified") return { label: "Fee Verified ✓", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (m.feeStatus === "waived") return { label: "Fee Waived ✓", cls: "bg-purple-100 text-purple-700 border-purple-200" };
  return null;
};

export const canApproveMemberFee = (m) =>
  m.feeStatus === "verified" || m.feeStatus === "waived" || m.feeStatus === "not_requested";

const FeeManagementTab = ({ pendingMembers, fetchPendingMembers, auth, notify, api, Spinner, inputCls }) => {
  const [subView, setSubView] = useState("pending");
  const [membershipFee, setMembershipFee] = useState(0);
  const [confirmRequest, setConfirmRequest] = useState(null);
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

  const actionMembers = (pendingMembers || []).filter((m) => {
    const needsRequest = m.interview_called && m.feeStatus === "not_requested";
    const needsReview = m.feeStatus === "submitted";
    return needsRequest || needsReview;
  });

  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const r = await api.get(`fees/records?page=${recordsPage}&limit=20`, auth);
      setRecords(r.data.records || []);
      setRecordsTotalPages(r.data.totalPages || 1);
    } catch {
      notify("Failed to load fee records", "error");
    } finally {
      setRecordsLoading(false);
    }
  }, [api, auth, recordsPage, notify]);

  useEffect(() => {
    api.get("settings").then((r) => {
      setMembershipFee(Number(r.data.membership_fee) || 0);
    }).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (subView === "records") fetchRecords();
  }, [subView, fetchRecords]);

  const handleRequestFee = async (memberId) => {
    setProcessing(true);
    try {
      const r = await api.post(`fees/request/${memberId}`, {}, auth);
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

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Management</h2>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Membership fee collection & verification</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button type="button" onClick={() => setSubView("pending")} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${subView === "pending" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500"}`}>
            Pending Actions
          </button>
          <button type="button" onClick={() => setSubView("records")} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${subView === "records" ? "bg-white text-[#002147] shadow-sm" : "text-slate-500"}`}>
            Fee Records
          </button>
        </div>
      </div>

      {subView === "pending" && (
        <div className="space-y-4">
          {actionMembers.length === 0 ? (
            <div className="text-center py-20 text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <i className="fas fa-money-check-alt text-5xl mb-4 block opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">No fee actions pending</p>
            </div>
          ) : actionMembers.map((m) => {
            const badge = getFeeCardBadge(m);
            const fp = m.feePayment || {};
            return (
              <div key={m._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{m.name}</h3>
                    <p className="text-xs text-slate-500">{m.email}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.tehsil || m.city || "—"}</p>
                  </div>
                  {badge && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${badge.cls}`}>{badge.label}</span>
                  )}
                </div>

                {m.feeStatus === "not_requested" && m.interview_called && (
                  <div className="flex flex-wrap gap-3">
                    {confirmRequest === m._id ? (
                      <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                        <p className="text-sm text-slate-700">Request membership fee of <strong>PKR {membershipFee || "—"}</strong>? The member will be notified by email.</p>
                        <div className="flex gap-2">
                          <button type="button" disabled={processing} onClick={() => handleRequestFee(m._id)} className="px-4 py-2 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Confirm</button>
                          <button type="button" onClick={() => setConfirmRequest(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setConfirmRequest(m._id)} className="px-5 py-2.5 bg-[#002147] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Request Fee</button>
                        <button type="button" onClick={() => { setWaiveTarget(m); setWaiveReason(""); }} className="px-5 py-2.5 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Grant Free Membership</button>
                      </>
                    )}
                  </div>
                )}

                {m.feeStatus === "submitted" && (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setExpandedProof(expandedProof === m._id ? null : m._id)} className="text-[10px] font-black uppercase tracking-widest text-[#002147] flex items-center gap-2">
                      <i className={`fas fa-chevron-${expandedProof === m._id ? "up" : "down"}`} /> View Proof
                    </button>
                    {expandedProof === m._id && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-2 text-sm">
                          <p><span className="font-bold text-slate-500">TID:</span> {fp.transactionId || "—"}</p>
                          <p><span className="font-bold text-slate-500">Channel:</span> {fp.paymentChannel || "—"}</p>
                          <p><span className="font-bold text-slate-500">Sender:</span> {fp.accountNumber || "—"}</p>
                          <p><span className="font-bold text-slate-500">Submitted:</span> {fp.submittedAt ? new Date(fp.submittedAt).toLocaleString() : "—"}</p>
                        </div>
                        {fp.screenshotUrl && (
                          <button type="button" onClick={() => setLightboxUrl(getImgUrl(fp.screenshotUrl))} className="block">
                            <img src={getImgUrl(fp.screenshotUrl)} alt="Payment proof" className="max-h-48 rounded-xl border border-slate-200 object-contain w-full bg-white" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button type="button" disabled={processing} onClick={() => handleVerify(m._id)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Verify Payment</button>
                      <button type="button" onClick={() => { setRejectTarget(m); setRejectReason(""); }} className="px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject Submission</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subView === "records" && (
        recordsLoading ? <Spinner /> : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member ID</th>
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
                      <tr><td colSpan={9} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">No records</td></tr>
                    ) : records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{rec.memberName}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{rec.member_id_str}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${ACTION_BADGE[rec.action] || "bg-slate-100 text-slate-600"}`}>{rec.action?.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-4 py-3">{rec.amount != null ? `PKR ${rec.amount}` : "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{rec.paymentChannel || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{rec.transactionId || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-xs">{rec.adminName || "—"}</td>
                        <td className="px-4 py-3">
                          {rec.screenshotUrl ? (
                            <button type="button" onClick={() => setLightboxUrl(getImgUrl(rec.screenshotUrl))} className="text-[10px] font-black uppercase text-[#002147]">View</button>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" disabled={recordsPage <= 1} onClick={() => setRecordsPage((p) => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-xs font-bold text-slate-500">Page {recordsPage} / {recordsTotalPages}</span>
              <button type="button" disabled={recordsPage >= recordsTotalPages} onClick={() => setRecordsPage((p) => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          </>
        )
      )}

      {waiveTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleWaive} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Grant Free Membership</h3>
            <p className="text-sm text-slate-500">Waive fee for <strong>{waiveTarget.name}</strong></p>
            <textarea rows={4} value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} placeholder="Reason for waiver (min 10 characters)" className={inputCls} required minLength={10} />
            <div className="flex gap-3">
              <button type="submit" disabled={processing} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Confirm Waiver</button>
              <button type="button" onClick={() => setWaiveTarget(null)} className="px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleReject} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Reject Fee Submission</h3>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason (sent to member)" className={inputCls} required />
            <div className="flex gap-3">
              <button type="submit" disabled={processing} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Reject & Notify</button>
              <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500">Cancel</button>
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

export default FeeManagementTab;
