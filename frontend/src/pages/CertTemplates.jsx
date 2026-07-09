import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
import signatureImg from "../assets/signature.png";
import stampImg from "../assets/sealcertificate.png";

export { logo, sealImg, signatureImg, stampImg };

export const CERT_THEME = {
  navy: "#002147",
  navyDark: "#001733",
  navyMid: "#003366",
  cyan: "#22d3ee",
  cyanBright: "#38bdf8",
  cyanDeep: "#0891b2",
  cyanDark: "#0e7490",
  gold: "#c8a951",
  goldLight: "#e8d5a3",
  text: "#0f172a",
  textBody: "#475569",
  textMuted: "#64748b",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
};

export const CHAIRMAN_NAME = "M Farooq Ahmad";
export const CHAIRMAN_TITLE = "Chairman SLS";

export const CERT_CANVAS = { width: 1123, height: 794 };

export const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  classicHeading: "'Fraunces', Georgia, serif",
  classicBody: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
};

const CLASSIC_V2 = {
  navy: "#06243f",
  navy2: "#0c3a63",
  navy3: "#103a66",
  cyan: "#19c1e6",
  cyanDeep: "#0a8fb0",
  gold: "#d4ad55",
  goldDeep: "#a9803a",
  paper: "#fbfaf6",
  ink: "#16223a",
  muted: "#5b6b85",
};

export const CERT_TEMPLATES = [
  { id: 1, name: "Classic", thumb: "🔵", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navy, textColor: CERT_THEME.text, borderColor: CERT_THEME.navy },
  { id: 2, name: "Membership", thumb: "🎖️", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navy, textColor: CERT_THEME.text, borderColor: CERT_THEME.gold },
  { id: 3, name: "Gold Border", thumb: "🏅", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.gold, textColor: CERT_THEME.text, borderColor: CERT_THEME.gold },
  { id: 4, name: "Corporate Navy", thumb: "🌊", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navy, textColor: CERT_THEME.text, borderColor: CERT_THEME.navy },
  { id: 5, name: "Elegant Frame", thumb: "✨", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navyMid, textColor: CERT_THEME.text, borderColor: CERT_THEME.navy },
  { id: 6, name: "Two-Tone Diagonal", thumb: "◆", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.cyan, textColor: CERT_THEME.text, borderColor: CERT_THEME.navy },
  { id: 7, name: "Seal-Centric", thumb: "🔏", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navy, textColor: CERT_THEME.text, borderColor: CERT_THEME.cyanDeep },
];

const TEMPLATE_LAYOUTS = Object.fromEntries(
  CERT_TEMPLATES.map((t) => [
    t.id,
    {
      ...t,
      logoPosition: t.id === 2 || t.id === 4 ? "center" : "left",
      titleMode: t.id === 5 ? "combined" : "split",
      issueDateVisible: t.id !== 7,
      stampPosition: t.id === 7 ? "prominent-right" : t.id === 2 ? "center" : "right",
      accentStyle: ["classic", "minimal", "gold", "corporate", "elegant", "diagonal", "seal"][t.id - 1],
    },
  ])
);

export const MEMBERSHIP_TEMPLATE_ID = 2;

export function enrichCertificateData(data, extras = {}) {
  const session =
    extras.session ||
    data.session ||
    data.memberId?.joining_year ||
    String(data.member_id_str || "").split("-")[0] ||
    String(new Date().getFullYear());
  const memberStatus = extras.memberStatus || data.memberStatus || "Active Member";
  return { ...data, session, memberStatus };
}

export function formatCertDate(value, fallback = "") {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return fallback;
  }
}

export function resolveCertificateContent(data) {
  const issueDate = formatCertDate(data.createdAt || data.issueDate, formatCertDate(new Date()));
  const eventDate = formatCertDate(data.eventId?.date, "");
  const memberName = data.memberId?.name || data.memberName || "Member Name";
  const eventTitle = data.eventId?.title || "";
  const awardType = data.awardType || "Of Participation";
  const titleLine = data.title || "CERTIFICATE";
  const memberIdStr = data.member_id_str || data.memberId?.member_id || "";
  const category =
    data.category === "Other" ? data.customCategory || "Other" : data.category || "Participation";
  const issueYear = new Date(data.createdAt || data.issueDate || Date.now()).getFullYear();
  const certNumber = data._id
    ? `SLS-${issueYear}-${String(data._id).slice(-5).toUpperCase()}`
    : `SLS-${issueYear}-PREVIEW`;

  let classicEyebrow = "Official Certification";
  let classicHeading = "CERTIFICATE";
  let classicAwardLine = awardType;
  const titleMatch = titleLine.match(/^certificate\s+of\s+(.+)$/i);
  if (titleMatch) {
    classicEyebrow = `Certificate of ${titleMatch[1]}`;
    classicHeading = "CERTIFICATE";
    if (!data.awardType) classicAwardLine = `Of ${titleMatch[1]}`;
  } else if (titleLine.toUpperCase() === "CERTIFICATE") {
    classicEyebrow = category ? `Certificate of ${category}` : "Official Certification";
  } else {
    classicEyebrow = titleLine;
    classicHeading = "CERTIFICATE";
  }

  return {
    issueDate,
    eventDate,
    memberName,
    eventTitle,
    awardType,
    titleLine,
    description: data.description || "",
    memberIdStr,
    category,
    certNumber,
    classicEyebrow,
    classicHeading,
    classicAwardLine,
    session:
      data.session ||
      data.memberId?.joining_year ||
      String(memberIdStr).split("-")[0] ||
      String(new Date().getFullYear()),
    memberStatus: data.memberStatus || "Active Member",
  };
}

/** Professional navy vector seal — always used instead of low-quality stamp PNG */
export const VerifiedStamp = ({ color = CERT_THEME.navy, id = "stamp", size = 128 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: "block", transform: "rotate(-8deg)", filter: "drop-shadow(0 2px 6px rgba(0,33,71,0.15))" }}>
    <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="1.8" strokeOpacity="0.9" />
    <circle cx="60" cy="60" r="49" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2.5" strokeOpacity="0.65" />
    <circle cx="60" cy="60" r="38" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.75" />
    <rect x="14" y="46" width="92" height="28" fill="#ffffff" stroke={color} strokeWidth="2" rx="2" />
    <text x="60" y="65" fontFamily={FONTS.body} fontSize="14" fontWeight="900" fill={color} textAnchor="middle" letterSpacing="1.2">
      VERIFIED
    </text>
    <text x="60" y="42" fontFamily={FONTS.body} fontSize="7.5" fill={color} textAnchor="middle" letterSpacing="3.5">
      ★ ★ ★
    </text>
    <text x="60" y="82" fontFamily={FONTS.body} fontSize="7.5" fill={color} textAnchor="middle" letterSpacing="3.5">
      ★ ★ ★
    </text>
    <path id={`stamp-top-${id}`} d="M 22 60 A 38 38 0 0 1 98 60" fill="none" />
    <path id={`stamp-bottom-${id}`} d="M 98 60 A 38 38 0 0 1 22 60" fill="none" />
    <text fontSize="7.8" fontWeight="950" fontFamily={FONTS.body} fill={color} letterSpacing="1.4">
      <textPath href={`#stamp-top-${id}`} startOffset="50%" textAnchor="middle">SERVE & LEAD</textPath>
    </text>
    <text fontSize="7.8" fontWeight="950" fontFamily={FONTS.body} fill={color} letterSpacing="1.4">
      <textPath href={`#stamp-bottom-${id}`} startOffset="50%" textAnchor="middle">SOCIETY</textPath>
    </text>
  </svg>
);

function IsometricCubeMesh({ theme, flip = false }) {
  return (
    <svg width="300" height="300" viewBox="0 0 340 340" style={{ display: "block", transform: flip ? "scale(-1)" : undefined }}>
      <g stroke={theme.cyanBright} strokeWidth="1.5" fill="none" opacity="0.85">
        <polygon points="40,0 -10,86.6 90,86.6" />
        <polygon points="-10,86.6 40,173.2 90,86.6" />
        <polygon points="90,86.6 40,173.2 140,173.2" />
        <polygon points="40,173.2 -10,259.8 90,259.8" />
        <polygon points="90,259.8 40,346.4 140,346.4" />
        <polygon points="290,173.2 240,259.8 340,259.8" />
      </g>
      <g stroke="#ffffff" strokeWidth="1">
        <polygon points="340,0 240,0 240,86.6 340,86.6" fill={theme.navy} />
        <polygon points="240,0 140,0 90,86.6 140,173.2 240,173.2 240,86.6" fill={theme.cyanDeep} />
        <polygon points="340,86.6 240,86.6 190,173.2 290,173.2" fill={theme.cyanBright} />
        <polygon points="140,0 40,0 90,86.6" fill={theme.navyDark} />
        <polygon points="140,173.2 90,259.8 190,259.8" fill={theme.cyan} opacity="0.9" />
        <polygon points="290,173.2 190,173.2 240,259.8" fill={theme.navyMid} />
      </g>
    </svg>
  );
}

function PolygonWatermark({ theme }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: 680, height: "100%", opacity: 0.045, pointerEvents: "none" }} viewBox="0 0 680 794">
      <polygon points="0,0 180,0 90,130 0,90" fill={theme.slate400} />
      <polygon points="90,130 260,100 170,260" fill={theme.slate400} />
      <polygon points="0,90 90,130 0,280" fill={theme.textMuted} />
      <polygon points="0,280 170,260 120,420 0,380" fill={theme.slate400} />
      <polygon points="170,260 260,100 360,220 300,400" fill={theme.textMuted} />
      <polygon points="120,420 300,400 240,580 60,540" fill={theme.slate400} />
      <polygon points="0,380 120,420 0,560" fill={theme.textMuted} />
      <polygon points="0,560 240,580 160,794 0,794" fill={theme.slate400} />
    </svg>
  );
}

function CornerAccents({ theme }) {
  const tri = (points, fill, opacity = 1) => (
    <polygon points={points} fill={fill} opacity={opacity} />
  );
  return (
    <>
      <svg style={{ position: "absolute", top: 0, left: 0, width: 120, height: 120, pointerEvents: "none" }} viewBox="0 0 120 120">
        {tri("0,0 120,0 0,120", theme.navy)}
        {tri("0,0 80,0 0,80", theme.cyan, 0.9)}
      </svg>
      <svg style={{ position: "absolute", top: 0, right: 0, width: 100, height: 100, pointerEvents: "none" }} viewBox="0 0 100 100">
        {tri("100,0 100,100 0,0", theme.cyanDeep, 0.75)}
      </svg>
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: 100, height: 100, pointerEvents: "none" }} viewBox="0 0 100 100">
        {tri("0,100 100,100 0,0", theme.cyanDeep, 0.75)}
      </svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, width: 130, height: 130, pointerEvents: "none" }} viewBox="0 0 130 130">
        {tri("130,130 130,0 0,130", theme.navy)}
        {tri("130,130 90,130 130,90", theme.cyan, 0.85)}
      </svg>
    </>
  );
}

function BrandLogo({ src, variant = "header" }) {
  const theme = CERT_THEME;
  if (variant === "hero") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 28px",
          background: theme.white,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,33,71,0.12), 0 2px 8px rgba(0,33,71,0.06)",
          border: `1px solid ${theme.slate200}`,
        }}
      >
        <img
          src={src}
          alt="Serve & Lead Society"
          style={{ width: 420, maxWidth: "100%", height: "auto", maxHeight: 118, objectFit: "contain", display: "block" }}
        />
      </div>
    );
  }
  return (
    <img src={src} alt="Serve & Lead Society" style={{ width: 360, height: "auto", maxHeight: 96, objectFit: "contain", display: "block" }} />
  );
}

function SignatureBlock({ certAssets, theme, align = "center" }) {
  const sigSrc = certAssets?.signature || signatureImg || "/signature.png";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "left" ? "flex-start" : "center",
        textAlign: align,
        minWidth: 220,
      }}
    >
      {/* 1. Signature image */}
      <div style={{ height: 72, display: "flex", alignItems: "flex-end", justifyContent: align === "left" ? "flex-start" : "center", width: "100%" }}>
        <img
          src={sigSrc}
          alt="Chairman Signature"
          style={{
            height: 64,
            width: "auto",
            maxWidth: 200,
            objectFit: "contain",
            display: "block",
            mixBlendMode: "multiply",
          }}
        />
      </div>
      {/* 2. Divider line */}
      <div
        style={{
          width: 200,
          height: 2,
          marginTop: 4,
          background: `linear-gradient(90deg, ${theme.navy}22, ${theme.navy}, ${theme.navy}22)`,
          borderRadius: 1,
        }}
      />
      {/* 3. Chairman name */}
      <p style={{ fontWeight: 800, fontSize: 15, color: theme.navy, margin: "10px 0 0", fontFamily: FONTS.body, letterSpacing: "0.02em" }}>
        {CHAIRMAN_NAME}
      </p>
      {/* 4. Title */}
      <p style={{ fontSize: 11, color: theme.cyanDeep, margin: "4px 0 0", fontWeight: 700, fontFamily: FONTS.body, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {CHAIRMAN_TITLE}
      </p>
    </div>
  );
}

function CertBodyText({ content, theme, accent }) {
  if (content.description) {
    return (
      <p style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: FONTS.body, fontSize: 13.5, lineHeight: 1.8, color: theme.textBody, fontStyle: "italic" }}>
        {content.description}
      </p>
    );
  }
  return (
    <div style={{ fontFamily: FONTS.body, fontSize: 13, lineHeight: 1.85, color: theme.textBody, fontStyle: "italic" }}>
      <p style={{ margin: 0 }}>has successfully participated in the online training session titled</p>
      <p style={{ margin: "8px 0", fontSize: 15, fontWeight: 800, color: accent, fontStyle: "normal" }}>
        “{content.eventTitle || "Orientation & How to Add References in MS Word"}”
      </p>
      {content.eventDate && <p style={{ margin: 0 }}>held on {content.eventDate}.</p>}
      <p style={{ margin: "10px 0 0", fontSize: 12, color: theme.textMuted }}>
        The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&amp;A session.
      </p>
    </div>
  );
}

function VerifyFooter({ theme }) {
  return (
    <p style={{ margin: 0, textAlign: "center", fontSize: 10.5, color: theme.textMuted, fontStyle: "italic", fontWeight: 700, letterSpacing: "0.03em" }}>
      Verify Through SLS Website by Using Membership ID
    </p>
  );
}

function ClassicThreadMark() {
  const c = CLASSIC_V2;
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 48, height: 48, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}>
      <circle cx="24" cy="24" r="22" stroke={c.cyan} strokeWidth="1.4" />
      <circle cx="24" cy="24" r="16" stroke={c.gold} strokeWidth="1" />
      <path d="M24 12L34 24L24 36L14 24L24 12Z" stroke="#ffffff" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function ClassicSealImage({ certAssets, size = 94 }) {
  const stampSrc = certAssets?.stamp || stampImg || "/stamp.png";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <img
        src={stampSrc}
        alt="Official Seal"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          transform: "rotate(-6deg)",
          filter: "drop-shadow(0 6px 10px rgba(6,36,63,0.25))",
        }}
      />
      <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: CLASSIC_V2.muted, fontFamily: FONTS.classicBody }}>
        Official Seal
      </div>
    </div>
  );
}

function ClassicSignatureBlock({ certAssets }) {
  const c = CLASSIC_V2;
  const sigSrc = certAssets?.signature || signatureImg || "/signature.png";
  return (
    <div style={{ width: 230, textAlign: "center" }}>
      <div style={{ height: 58, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <img
          src={sigSrc}
          alt="Chairman Signature"
          style={{
            height: 52,
            width: "auto",
            maxWidth: 210,
            objectFit: "contain",
            display: "block",
            mixBlendMode: "multiply",
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          margin: "6px 0 8px",
          background: "linear-gradient(90deg, transparent, rgba(22,34,58,0.4) 15%, rgba(22,34,58,0.4) 85%, transparent)",
        }}
      />
      <div style={{ fontWeight: 700, fontSize: 13, color: c.navy, fontFamily: FONTS.classicBody }}>{CHAIRMAN_NAME}</div>
      <div style={{ fontSize: 10.5, color: c.muted, fontStyle: "italic", marginTop: 1, fontFamily: FONTS.classicBody }}>
        Chairman, Serve &amp; Lead Society
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 8.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: c.cyanDeep,
          marginTop: 6,
          opacity: 0.85,
          fontFamily: FONTS.classicBody,
        }}
      >
        🔒 Fixed on every template
      </div>
    </div>
  );
}

function ClassicBodyText({ content }) {
  const c = CLASSIC_V2;
  if (content.description) {
    return (
      <p
        style={{
          margin: "24px auto 0",
          maxWidth: 680,
          textAlign: "center",
          fontSize: 13,
          lineHeight: 1.85,
          color: c.muted,
          fontFamily: FONTS.classicBody,
          whiteSpace: "pre-wrap",
        }}
      >
        {content.description}
      </p>
    );
  }
  return (
    <p
      style={{
        maxWidth: 680,
        margin: "24px auto 0",
        textAlign: "center",
        fontSize: 13,
        lineHeight: 1.85,
        color: c.muted,
        fontFamily: FONTS.classicBody,
      }}
    >
      for active participation, sound contribution, and demonstrated commitment during{" "}
      <span style={{ color: c.navy, fontWeight: 700, fontStyle: "normal" }}>
        &ldquo;{content.eventTitle || "Orientation & How to Add References in MS Word"}&rdquo;
      </span>
      {content.eventDate ? `, held on ${content.eventDate}` : ""} — completing all sessions, assessments, and the closing review.
    </p>
  );
}

/** Template 1 — Threadline Navy v2 (from certificate-sample-v2.html) */
function ClassicCertificate({ data, certAssets, id = "cert-inner" }) {
  const c = CLASSIC_V2;
  const content = resolveCertificateContent(data);
  const logoSrc = certAssets?.logo || "/logo-certificate.png" || logo;

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: CERT_CANVAS.width,
        height: CERT_CANVAS.height,
        background: `radial-gradient(900px 500px at 85% -10%, rgba(25,193,230,0.05), transparent 60%), linear-gradient(180deg, #fffefb 0%, ${c.paper} 100%)`,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.classicBody,
        color: c.ink,
        borderRadius: 2,
      }}
    >
      {/* Paper grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(6,36,63,0.03) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(1000px 700px at 50% 45%, transparent 55%, rgba(6,36,63,0.05) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Left rail */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 104,
          height: "100%",
          background: `linear-gradient(160deg, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, ${c.navy} 0%, ${c.navy3} 50%, ${c.navy} 100%)`,
          boxShadow: "6px 0 24px -8px rgba(6,36,63,0.55), inset -1px 0 0 rgba(255,255,255,0.06)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 48%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -1,
            width: 6,
            height: "100%",
            background: `linear-gradient(180deg, ${c.cyan} 0%, ${c.gold} 50%, ${c.cyan} 100%)`,
            boxShadow: "1px 0 6px rgba(25,193,230,0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 11,
            letterSpacing: "0.32em",
            fontWeight: 700,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          SERVE &amp; LEAD SOCIETY
        </div>
        <div style={{ position: "absolute", bottom: 40, left: 0, width: 104, display: "flex", justifyContent: "center" }}>
          <ClassicThreadMark />
        </div>
      </div>

      {/* Double frame */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          bottom: 18,
          left: 122,
          border: "1px solid rgba(6,36,63,0.14)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.6)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          bottom: 24,
          left: 128,
          border: `1px solid rgba(212,173,85,0.45)`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 20,
          height: 20,
          borderTop: `1.5px solid ${c.goldDeep}`,
          borderRight: `1.5px solid ${c.goldDeep}`,
          opacity: 0.7,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 20,
          height: 20,
          borderBottom: `1.5px solid ${c.goldDeep}`,
          borderRight: `1.5px solid ${c.goldDeep}`,
          opacity: 0.7,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 104,
          right: 0,
          bottom: 0,
          padding: "50px 70px 44px 68px",
          display: "flex",
          flexDirection: "column",
          zIndex: 3,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={logoSrc}
              alt="Serve & Lead Society"
              style={{ width: 72, height: 72, objectFit: "contain", display: "block", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: c.navy, letterSpacing: "0.01em" }}>Serve &amp; Lead Society</div>
              <div style={{ fontSize: 10.5, color: c.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
                Official Certification
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10.5, color: c.muted }}>
            <div>
              Certificate No. <span style={{ fontWeight: 700, color: c.navy, letterSpacing: "0.04em" }}>{content.certNumber}</span>
            </div>
            <div style={{ marginTop: 3 }}>Issued&nbsp;{content.issueDate}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 34, textAlign: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: c.cyanDeep,
              fontWeight: 700,
            }}
          >
            <span style={{ width: 30, height: 1, background: c.cyanDeep, opacity: 0.5 }} />
            {content.classicEyebrow}
            <span style={{ width: 30, height: 1, background: c.cyanDeep, opacity: 0.5 }} />
          </span>
          <h1
            style={{
              fontFamily: FONTS.classicHeading,
              fontWeight: 600,
              fontSize: 56,
              background: `linear-gradient(180deg, ${c.navy2} 0%, ${c.navy} 70%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "0.005em",
              marginTop: 6,
              lineHeight: 1.05,
              filter: "drop-shadow(0 1px 1px rgba(6,36,63,0.08))",
            }}
          >
            {content.classicHeading}
          </h1>
          <div
            style={{
              marginTop: 10,
              fontFamily: FONTS.classicHeading,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 19,
              color: c.cyanDeep,
            }}
          >
            {content.classicAwardLine}
          </div>
        </div>

        {/* Recipient */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              marginTop: 26,
              fontSize: 12.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: c.muted,
            }}
          >
            This certificate is proudly presented to
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONTS.classicHeading,
              fontWeight: 600,
              fontSize: 41,
              color: c.ink,
              position: "relative",
              display: "inline-block",
              paddingBottom: 12,
              textShadow: "0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            {content.memberName}
            <span
              style={{
                content: '""',
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
                width: 360,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${c.goldDeep} 15%, ${c.gold} 50%, ${c.goldDeep} 85%, transparent)`,
                boxShadow: "0 1px 2px rgba(164,128,58,0.35)",
                display: "block",
              }}
            />
          </div>
        </div>

        <ClassicBodyText content={content} />

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingTop: 28,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -10,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(6,36,63,0.08) 20%, rgba(6,36,63,0.08) 80%, transparent)",
            }}
          />
          <ClassicSignatureBlock certAssets={certAssets} />
          <ClassicSealImage certAssets={certAssets} />
          <div style={{ width: 230, textAlign: "right" }}>
            {content.memberIdStr && (
              <div style={{ fontSize: 10.5, color: c.muted, marginBottom: 4 }}>
                Member ID&nbsp; <b style={{ color: c.navy, fontWeight: 700 }}>{content.memberIdStr}</b>
              </div>
            )}
            <div style={{ fontSize: 10.5, color: c.muted, marginBottom: 4 }}>
              Category&nbsp; <b style={{ color: c.navy, fontWeight: 700 }}>{content.category}</b>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: c.muted, fontStyle: "italic" }}>
              Verify at serveandlead.org/verify using the Member ID above
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MEMBERSHIP_THEME = {
  navy: "#002147",
  navyDeep: "#0d3b66",
  sky: "#1ba3e0",
  gold: "#c8a951",
  goldDeep: "#a9803a",
  white: "#ffffff",
  paper: "#fafbfc",
  text: "#0f172a",
  muted: "#64748b",
};

function MembershipCorner({ style }) {
  return <div style={{ position: "absolute", width: 24, height: 24, pointerEvents: "none", ...style }} />;
}

function MembershipInfoIcon({ type }) {
  const c = MEMBERSHIP_THEME.sky;
  if (type === "id") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M15 9h4M15 13h4" />
      </svg>
    );
  }
  if (type === "session") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  );
}

function MembershipInfoCell({ icon, label, value }) {
  const t = MEMBERSHIP_THEME;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
      <MembershipInfoIcon type={icon} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", fontFamily: FONTS.body }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: t.white, fontFamily: FONTS.body, textAlign: "center", wordBreak: "break-word" }}>
        {value}
      </span>
    </div>
  );
}

/** Template 2 — Certificate of Membership (auto-issued on approval) */
function MembershipCertificate({ data, certAssets, id = "cert-inner" }) {
  const t = MEMBERSHIP_THEME;
  const content = resolveCertificateContent(data);
  const logoSrc = certAssets?.logo || "/logo-certificate.png" || logo;
  const sigSrc = certAssets?.signature || signatureImg || "/signature.png";
  const stampSrc = certAssets?.stamp || stampImg || "/stamp.png";

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: CERT_CANVAS.width,
        height: CERT_CANVAS.height,
        background: `linear-gradient(165deg, ${t.white} 0%, ${t.paper} 50%, ${t.white} 100%)`,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.body,
        color: t.text,
      }}
    >
      {/* Subtle geometric watermark */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage:
            "linear-gradient(30deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%), linear-gradient(150deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%)",
          backgroundSize: "48px 84px",
          pointerEvents: "none",
        }}
      />

      {/* Navy + gold double border */}
      <div style={{ position: "absolute", inset: 14, border: `3px solid ${t.navy}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 22, border: `1.5px solid ${t.gold}`, pointerEvents: "none" }} />

      <MembershipCorner style={{ top: 22, left: 22, borderTop: `3px solid ${t.gold}`, borderLeft: `3px solid ${t.gold}` }} />
      <MembershipCorner style={{ top: 22, right: 22, borderTop: `3px solid ${t.gold}`, borderRight: `3px solid ${t.gold}` }} />
      <MembershipCorner style={{ bottom: 22, left: 22, borderBottom: `3px solid ${t.gold}`, borderLeft: `3px solid ${t.gold}` }} />
      <MembershipCorner style={{ bottom: 22, right: 22, borderBottom: `3px solid ${t.gold}`, borderRight: `3px solid ${t.gold}` }} />

      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: 6,
          background: `linear-gradient(90deg, ${t.navyDeep}, ${t.sky}, ${t.navyDeep})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto auto",
          padding: "36px 48px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Header — logo + title */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <img src={logoSrc} alt="Serve & Lead Society" style={{ width: 200, height: "auto", maxHeight: 72, objectFit: "contain" }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: t.muted, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Official Document</p>
            <p style={{ fontSize: 10, color: t.navy, fontWeight: 700, margin: "4px 0 0" }}>No. {content.certNumber}</p>
          </div>
        </header>

        {/* Title block */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <h1
            style={{
              fontFamily: FONTS.heading,
              fontSize: 42,
              fontWeight: 900,
              color: t.navy,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Certificate of Membership
          </h1>
          <p style={{ fontSize: 13, fontStyle: "italic", color: t.muted, margin: "12px 0 0", letterSpacing: "0.04em" }}>
            This Certifies That
          </p>
          <h2
            style={{
              fontFamily: FONTS.heading,
              fontSize: 34,
              fontWeight: 700,
              color: t.text,
              margin: "16px 0 0",
              paddingBottom: 10,
              borderBottom: `2px solid ${t.navy}`,
              display: "inline-block",
              minWidth: 420,
              maxWidth: "90%",
            }}
          >
            {content.memberName}
          </h2>
        </div>

        {/* Body */}
        <main style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: "8px 0" }}>
          {/* Member information band */}
          <div
            style={{
              background: `linear-gradient(90deg, ${t.navyDeep} 0%, ${t.navy} 50%, ${t.navyDeep} 100%)`,
              borderRadius: 8,
              border: `1px solid ${t.gold}55`,
              padding: "16px 20px",
              boxShadow: "0 4px 16px rgba(0,33,71,0.15)",
            }}
          >
            <p
              style={{
                textAlign: "center",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: t.gold,
                margin: "0 0 14px",
              }}
            >
              Member Information
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <MembershipInfoCell icon="id" label="Membership ID" value={content.memberIdStr || "—"} />
              <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.15)" }} />
              <MembershipInfoCell icon="session" label="Session" value={String(content.session)} />
              <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.15)" }} />
              <MembershipInfoCell icon="status" label="Status" value={content.memberStatus} />
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              lineHeight: 1.8,
              color: t.muted,
              margin: 0,
              maxWidth: 720,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {content.description ||
              "is hereby recognized as an official member of Serve & Lead Society, having fulfilled all membership requirements and demonstrated commitment to our mission of building leaders through service."}
          </p>
        </main>

        {/* Together banner */}
        <div
          style={{
            background: `linear-gradient(90deg, ${t.navyDeep}, ${t.sky}, ${t.navyDeep})`,
            padding: "10px 24px",
            borderRadius: 4,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(13,59,102,0.2)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: t.white,
              fontFamily: FONTS.body,
            }}
          >
            Together We Serve, Together We Lead
          </p>
        </div>

        {/* Footer — signature, issued date, stamp */}
        <footer style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "end", gap: 24, marginTop: 16 }}>
          <div>
            <div style={{ height: 56, display: "flex", alignItems: "flex-end" }}>
              <img src={sigSrc} alt="Chairman Signature" style={{ height: 50, objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <div style={{ width: 180, height: 2, background: t.navy, marginTop: 4, opacity: 0.35 }} />
            <p style={{ fontWeight: 800, fontSize: 13, color: t.navy, margin: "8px 0 0" }}>{CHAIRMAN_NAME}</p>
            <p style={{ fontSize: 10, color: t.muted, margin: "2px 0 0", fontStyle: "italic" }}>{CHAIRMAN_TITLE}</p>
          </div>

          <div style={{ textAlign: "center", paddingBottom: 8 }}>
            <p style={{ fontSize: 10, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Issued on</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: t.navy, margin: "4px 0 0" }}>{content.issueDate}</p>
            <p style={{ fontSize: 9, color: t.muted, margin: "10px 0 0", fontStyle: "italic" }}>
              Verify at serveandlead.org/verify
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
            <img
              src={stampSrc}
              alt="Verified"
              style={{
                width: 100,
                height: 100,
                objectFit: "contain",
                transform: "rotate(-8deg)",
                filter: "drop-shadow(0 4px 8px rgba(0,33,71,0.2))",
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

function Decorations({ layout, theme }) {
  const { accentStyle } = layout;

  if (accentStyle === "minimal") {
    return (
      <>
        <div style={{ position: "absolute", inset: 24, border: `1px solid ${theme.slate200}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 32, left: 32, width: 56, height: 56, borderTop: `4px solid ${theme.cyanDeep}`, borderLeft: `4px solid ${theme.cyanDeep}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 32, right: 32, width: 56, height: 56, borderBottom: `4px solid ${theme.cyanDeep}`, borderRight: `4px solid ${theme.cyanDeep}`, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "gold") {
    return (
      <>
        <div style={{ position: "absolute", inset: 14, border: `3px solid ${theme.gold}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 22, border: `1px solid ${theme.navy}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 280, height: 8, background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)` }} />
        <CornerAccents theme={theme} />
      </>
    );
  }

  if (accentStyle === "corporate") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 76, background: theme.navy, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 76, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${theme.cyan}, ${theme.cyanDeep})`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: theme.slate50, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "elegant") {
    return (
      <>
        <div style={{ position: "absolute", inset: 18, border: `1px solid ${theme.navy}`, opacity: 0.35, pointerEvents: "none" }} />
        <PolygonWatermark theme={theme} />
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
          const pos = { "top-left": { top: 12, left: 12 }, "top-right": { top: 12, right: 12 }, "bottom-left": { bottom: 12, left: 12 }, "bottom-right": { bottom: 12, right: 12 } }[corner];
          return <div key={corner} style={{ position: "absolute", ...pos, width: 40, height: 40, border: `2px solid ${theme.cyanDeep}`, borderRadius: 2, pointerEvents: "none" }} />;
        })}
      </>
    );
  }

  if (accentStyle === "diagonal") {
    return (
      <>
        <svg style={{ position: "absolute", top: 0, right: 0, width: 340, height: 240, pointerEvents: "none" }} viewBox="0 0 340 240">
          <polygon points="340,0 200,0 340,160" fill={theme.cyan} opacity="0.88" />
          <polygon points="340,0 260,0 340,90" fill={theme.navy} />
          <line x1="200" y1="0" x2="340" y2="160" stroke={theme.gold} strokeWidth="6" />
        </svg>
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: 300, height: 200, pointerEvents: "none" }} viewBox="0 0 300 200">
          <polygon points="0,200 0,110 220,200" fill={theme.cyanDeep} opacity="0.8" />
          <polygon points="0,200 90,200 0,130" fill={theme.navy} />
        </svg>
        <div style={{ position: "absolute", inset: 20, border: `1px solid ${theme.slate200}`, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "seal") {
    return (
      <>
        <div style={{ position: "absolute", inset: 20, border: `2px solid ${theme.cyanDeep}`, borderRadius: 4, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: 70, transform: "translateY(-50%)", width: 220, height: 220, borderRadius: "50%", border: `2px dashed ${theme.cyan}44`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: 70, transform: "translateY(-50%)", width: 190, height: 190, borderRadius: "50%", border: `1px solid ${theme.navy}22`, pointerEvents: "none" }} />
      </>
    );
  }

  return null;
}

export function CertificateBase({ data, certAssets, id = "cert-inner", layout }) {
  const theme = CERT_THEME;
  const content = resolveCertificateContent(data);
  const isCorporate = layout.accentStyle === "corporate";
  const logoSrc = certAssets?.logo || "/logo-certificate.png" || logo;

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: CERT_CANVAS.width,
        height: CERT_CANVAS.height,
        backgroundColor: layout.bgColor || theme.white,
        fontFamily: FONTS.body,
        overflow: "hidden",
        boxSizing: "border-box",
        color: theme.text,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      <Decorations layout={layout} theme={theme} />

      <header
        style={{
          position: "relative",
          zIndex: 2,
          padding: isCorporate ? "92px 52px 0" : "36px 52px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: layout.logoPosition === "center" ? "center" : "flex-start",
        }}
      >
        {layout.logoPosition === "center" ? (
          <BrandLogo src={logoSrc} variant="hero" />
        ) : (
          <BrandLogo src={logoSrc} />
        )}
        {layout.issueDateVisible && (
          <p style={{ marginTop: 12, marginLeft: layout.logoPosition === "center" ? 0 : 16, fontSize: 11.5, fontWeight: 600, color: theme.textBody }}>
            Date of Issue: <span style={{ color: theme.navy, fontWeight: 800 }}>{content.issueDate}</span>
          </p>
        )}
      </header>

      <main
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: layout.accentStyle === "seal" ? "0 340px 0 64px" : "0 72px",
        }}
      >
        {layout.titleMode === "combined" ? (
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 40, fontWeight: 900, color: layout.accentColor, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.15, margin: 0 }}>
            {content.titleLine}
            <span style={{ display: "block", fontSize: 24, fontWeight: 700, marginTop: 8, fontStyle: "italic", textTransform: "none", color: theme.cyanDeep }}>{content.awardType}</span>
          </h1>
        ) : (
          <>
            <h1 style={{ fontFamily: FONTS.heading, fontSize: 52, fontWeight: 900, color: theme.navy, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
              {content.titleLine}
            </h1>
            <p style={{ fontFamily: FONTS.heading, fontSize: 24, color: layout.accentStyle === "gold" ? theme.gold : theme.cyanDeep, margin: "12px 0 0", fontStyle: "italic", fontWeight: 700 }}>
              {content.awardType}
            </p>
          </>
        )}

        <p style={{ fontSize: 12.5, fontStyle: "italic", color: theme.textMuted, marginTop: 16, letterSpacing: "0.05em" }}>This certificate is presented to</p>

        <h2 style={{ fontFamily: FONTS.heading, fontSize: 38, fontWeight: 700, color: theme.text, margin: "26px 0 0", paddingBottom: 10, borderBottom: `2.5px solid ${layout.borderColor || theme.navy}`, minWidth: 440, maxWidth: "90%" }}>
          {content.memberName}
        </h2>

        <div style={{ marginTop: 26, maxWidth: 780, width: "100%" }}>
          <CertBodyText content={content} theme={theme} accent={layout.accentColor || theme.navy} />
        </div>
      </main>

      <footer style={{ position: "relative", zIndex: 2, padding: "0 52px 40px" }}>
        <div style={{ display: "flex", justifyContent: layout.stampPosition === "center" ? "center" : "space-between", alignItems: "flex-end", gap: 48, maxWidth: layout.stampPosition === "center" ? 560 : "100%", margin: layout.stampPosition === "center" ? "0 auto" : undefined }}>
          <SignatureBlock certAssets={certAssets} theme={theme} align="left" />
          <div style={{ padding: 6, background: "rgba(255,255,255,0.9)", borderRadius: "50%", boxShadow: "0 4px 16px rgba(0,33,71,0.08)" }}>
            <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={layout.stampPosition === "prominent-right" ? 140 : 128} />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <VerifyFooter theme={theme} />
        </div>
      </footer>
    </div>
  );
}

export function RenderCertificate({ templateId = 1, data, certAssets, id = "cert-inner" }) {
  const tid = Number(templateId) || 1;
  if (tid === 1) return <ClassicCertificate data={data} certAssets={certAssets} id={id} />;
  if (tid === MEMBERSHIP_TEMPLATE_ID) return <MembershipCertificate data={data} certAssets={certAssets} id={id} />;
  const layout = TEMPLATE_LAYOUTS[tid] || TEMPLATE_LAYOUTS[3];
  return <CertificateBase data={data} certAssets={certAssets} id={id} layout={layout} />;
}

export const Template1 = (props) => <RenderCertificate templateId={1} {...props} />;
export const Template2 = (props) => <RenderCertificate templateId={2} {...props} />;
export const Template3 = (props) => <RenderCertificate templateId={3} {...props} />;
export const Template4 = (props) => <RenderCertificate templateId={4} {...props} />;
export const Template5 = (props) => <RenderCertificate templateId={5} {...props} />;
export const Template6 = (props) => <RenderCertificate templateId={6} {...props} />;
export const Template7 = (props) => <RenderCertificate templateId={7} {...props} />;

export function getCertificateComponent(templateId) {
  const id = Number(templateId) || 1;
  const map = { 1: Template1, 2: Template2, 3: Template3, 4: Template4, 5: Template5, 6: Template6, 7: Template7 };
  return map[id] || Template1;
}
