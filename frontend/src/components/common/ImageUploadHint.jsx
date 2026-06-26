const HINT_TEXT = {
  default: "JPG / PNG / WEBP · Max 5 MB · Recommended: 300×300 px minimum, square",
  blog: "JPG / PNG / WEBP · Max 10 MB · Recommended: 1200×630 px (landscape 16:9)",
  portrait: "JPG / PNG / WEBP · Max 5 MB · Recommended: 400×500 px (portrait 4:5)",
};

export default function ImageUploadHint({ variant = "default", className = "" }) {
  return (
    <p className={`mt-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 ${className}`}>
      <i className="fas fa-circle-info text-slate-300 shrink-0" />
      {HINT_TEXT[variant] || HINT_TEXT.default}
    </p>
  );
}
