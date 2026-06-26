import { useState } from "react";

const ADMIN_WHATSAPP = "923141683402";

export default function MemberSupportWhatsApp({ name, email, feeAmount, feeStatus, compact = false }) {
    const [issue, setIssue] = useState("");

    const buildWhatsAppLink = () => {
        const lines = [
            "Hello SLS Admin,",
            "",
            `Name: ${name || "—"}`,
            `Email: ${email || "—"}`,
        ];
        if (feeAmount) lines.push(`Membership Fee: PKR ${feeAmount}`);
        if (feeStatus) lines.push(`Application Status: ${feeStatus}`);
        lines.push("", issue.trim() || "I need help regarding my membership application / fee payment.");
        return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
    };

    if (compact) {
        return (
            <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1ebe57] transition-colors shadow-lg shadow-emerald-900/10"
            >
                <i className="fab fa-whatsapp text-lg" />
                Chat on WhatsApp
            </a>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <i className="fab fa-whatsapp text-2xl" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Need Help?</p>
                        <h2 className="text-lg font-black uppercase tracking-tight">WhatsApp Support</h2>
                    </div>
                </div>
                <p className="text-sm text-white/80 mt-3 leading-relaxed">
                    Facing an issue with your fee, deadline, or payment proof? Message our admin team directly on WhatsApp.
                </p>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Describe your issue (optional)
                    </label>
                    <textarea
                        rows={3}
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        placeholder="e.g. I sent PKR 500 but the fee is PKR 1000. Please guide me on the remaining amount."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:bg-white focus:border-emerald-200 transition-all"
                    />
                </div>
                <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1ebe57] transition-colors shadow-lg shadow-emerald-900/10"
                >
                    <i className="fab fa-whatsapp text-xl" />
                    Open WhatsApp &amp; Send Message
                </a>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Your name and email will be included automatically so admin can find your application quickly.
                </p>
            </div>
        </div>
    );
}
