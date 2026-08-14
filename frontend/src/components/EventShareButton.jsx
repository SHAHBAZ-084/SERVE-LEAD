import { useEffect, useRef, useState } from "react";
import {
  copyEventShareText,
  eventJoinUrl,
  eventSharePreviewUrl,
  formatEventShareText,
  shareEventNative,
} from "../utils/eventShare";

export default function EventShareButton({ event, variant = "overlay" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!event?._id) return null;

  const text = formatEventShareText(event);
  const previewUrl = eventSharePreviewUrl(event._id);
  const joinUrl = eventJoinUrl(event._id);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewUrl)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(previewUrl)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(event.title || "SLS Event")}&body=${encodeURIComponent(text)}`;

  const onShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const usedNative = await shareEventNative(event);
    if (!usedNative) setOpen((v) => !v);
  };

  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await copyEventShareText(event);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnCls =
    variant === "overlay"
      ? "w-10 h-10 rounded-xl bg-white/90 text-[#002147] shadow-lg border border-white/70 hover:bg-[#002147] hover:text-white"
      : "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-[#002147] hover:text-white";

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onShare}
        className={`${btnCls} flex items-center justify-center transition-all`}
        title="Share event"
        aria-label="Share event"
      >
        <i className="fas fa-share-nodes text-sm" />
        {variant !== "overlay" && <span>Share</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40">
          <button
            type="button"
            onClick={onCopy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
          >
            <i className={`fas ${copied ? "fa-check text-emerald-500" : "fa-copy"} w-4 text-center`} />
            {copied ? "Copied" : "Copy details"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
          >
            <i className="fab fa-whatsapp w-4 text-center" /> WhatsApp
          </a>
          <a
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
          >
            <i className="fab fa-facebook-f w-4 text-center" /> Facebook
          </a>
          <a
            href={linkedInHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-700 hover:bg-sky-50"
          >
            <i className="fab fa-linkedin-in w-4 text-center" /> LinkedIn
          </a>
          <a
            href={emailHref}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
          >
            <i className="fas fa-envelope w-4 text-center" /> Email
          </a>
          <a
            href={joinUrl}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#002147] hover:bg-slate-50 border-t border-slate-50 mt-1 pt-3"
          >
            <i className="fas fa-link w-4 text-center" /> Join page
          </a>
        </div>
      )}
    </div>
  );
}
