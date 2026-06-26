import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";

export { logo, sealImg };

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
};

export const CERT_TEMPLATES = [
  { id: 1, name: "Classic", thumb: "🔵", orientation: "landscape", bgColor: CERT_THEME.white, accentColor: CERT_THEME.navy, textColor: CERT_THEME.text, borderColor: CERT_THEME.navy },
  { id: 2, name: "Modern Minimal", thumb: "◻️", orientation: "landscape", bgColor: CERT_THEME.slate50, accentColor: CERT_THEME.cyanDeep, textColor: CERT_THEME.text, borderColor: CERT_THEME.slate200 },
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

  return { issueDate, eventDate, memberName, eventTitle, awardType, titleLine, description: data.description || "" };
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

function BrandLogo({ src, height = 96 }) {
  const theme = CERT_THEME;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 20px 10px 14px",
        background: `linear-gradient(105deg, ${theme.navy}08 0%, ${theme.cyan}12 55%, transparent 100%)`,
        borderLeft: `5px solid ${theme.cyanDeep}`,
        borderRadius: "0 12px 12px 0",
        boxShadow: `0 4px 18px ${theme.navy}10`,
      }}
    >
      <img src={src} alt="Serve & Lead Society" style={{ height, width: "auto", objectFit: "contain", display: "block" }} />
    </div>
  );
}

function SignatureBlock({ certAssets, theme, size = "default" }) {
  const sigH = size === "large" ? 72 : 64;
  const lineW = size === "large" ? 200 : 180;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: 200 }}>
      <div style={{ height: 78, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 2 }}>
        <img
          src={certAssets?.signature || "/signature.png"}
          alt="Signature"
          style={{ height: sigH, objectFit: "contain", maxWidth: 220, filter: "contrast(1.05)" }}
        />
      </div>
      <div style={{ width: lineW, height: 2, background: `linear-gradient(90deg, transparent, ${theme.navy}, transparent)`, marginBottom: 8 }} />
      <p style={{ fontWeight: 800, fontSize: 14, color: theme.navy, margin: 0, fontFamily: FONTS.body, letterSpacing: "0.02em" }}>{CHAIRMAN_NAME}</p>
      <p style={{ fontSize: 11, color: theme.cyanDeep, margin: "3px 0 0", fontWeight: 700, fontStyle: "italic", fontFamily: FONTS.body, textTransform: "uppercase", letterSpacing: "0.08em" }}>
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

/** Template 1 — inspired by Blue Abstract / Purple Polygon samples */
function ClassicCertificate({ data, certAssets, id = "cert-inner" }) {
  const theme = CERT_THEME;
  const content = resolveCertificateContent(data);
  const logoSrc = certAssets?.logo || "/logo-certificate.png" || logo;

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: CERT_CANVAS.width,
        height: CERT_CANVAS.height,
        backgroundColor: theme.white,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.body,
        color: theme.text,
      }}
    >
      <PolygonWatermark theme={theme} />
      <CornerAccents theme={theme} />

      {/* Double frame */}
      <div style={{ position: "absolute", inset: 14, border: `2.5px solid ${theme.navy}`, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 20, border: `1px solid ${theme.navy}`, opacity: 0.35, pointerEvents: "none", zIndex: 1 }} />

      {/* Isometric cubes — top-right & bottom-left */}
      <div style={{ position: "absolute", top: 8, right: 8, width: 280, height: 280, pointerEvents: "none", zIndex: 2, opacity: 0.95 }}>
        <IsometricCubeMesh theme={theme} />
      </div>
      <div style={{ position: "absolute", bottom: 8, left: 8, width: 260, height: 260, pointerEvents: "none", zIndex: 2, opacity: 0.9 }}>
        <IsometricCubeMesh theme={theme} flip />
      </div>

      {/* Top header band */}
      <div style={{ position: "absolute", top: 28, left: 36, right: 36, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <BrandLogo src={logoSrc} height={96} />
          <p style={{ margin: "12px 0 0 18px", fontSize: 11.5, fontWeight: 600, color: theme.textBody, fontFamily: FONTS.body }}>
            Date of Issue: <span style={{ color: theme.navy, fontWeight: 800 }}>{content.issueDate}</span>
          </p>
        </div>
        <div style={{ marginTop: 8, padding: "6px 14px", background: `${theme.cyan}18`, border: `1px solid ${theme.cyanDeep}44`, borderRadius: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: theme.navyMid, letterSpacing: "0.2em", textTransform: "uppercase" }}>Official Document</span>
        </div>
      </div>

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 820,
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, transparent, ${theme.gold})` }} />
          <div style={{ width: 8, height: 8, background: theme.cyanDeep, transform: "rotate(45deg)" }} />
          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${theme.gold}, transparent)` }} />
        </div>

        <h1 style={{ fontFamily: FONTS.heading, fontSize: 56, fontWeight: 900, color: theme.navy, letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
          {content.titleLine}
        </h1>
        <p style={{ fontFamily: FONTS.heading, fontSize: 26, color: theme.cyanDeep, margin: "10px 0 0", fontStyle: "italic", fontWeight: 700 }}>
          {content.awardType}
        </p>

        <p style={{ fontSize: 12.5, fontStyle: "italic", color: theme.textMuted, marginTop: 18, letterSpacing: "0.06em" }}>
          This certificate is presented to
        </p>

        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: 40,
            fontWeight: 700,
            color: theme.text,
            margin: "24px auto 0",
            paddingBottom: 10,
            borderBottom: `2.5px solid ${theme.navy}`,
            display: "inline-block",
            minWidth: 480,
            maxWidth: "95%",
          }}
        >
          {content.memberName}
        </h2>

        <div style={{ marginTop: 26, padding: "0 24px" }}>
          <CertBodyText content={content} theme={theme} accent={theme.navyMid} />
        </div>
      </div>

      {/* Footer — signature left, stamp center, accent bar right */}
      <div style={{ position: "absolute", bottom: 52, left: 56, right: 56, zIndex: 5, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <SignatureBlock certAssets={certAssets} theme={theme} size="large" />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", paddingBottom: 4 }}>
          <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={132} />
        </div>
        <div style={{ width: 200, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.35 }}>
          <div style={{ width: 160, height: 2, background: theme.navy, marginBottom: 8 }} />
          <span style={{ fontSize: 10, color: theme.textMuted, fontStyle: "italic" }}>Authorized</span>
        </div>
      </div>

      {/* Bottom ribbon */}
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 280, height: 36, background: `linear-gradient(90deg, ${theme.cyanDeep}, ${theme.navy})`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 900, color: theme.white, letterSpacing: "0.14em", textTransform: "uppercase" }}>Serve &amp; Lead Society</span>
      </div>

      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, zIndex: 6 }}>
        <VerifyFooter theme={theme} />
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
          <img src={logoSrc} alt="Serve & Lead Society" style={{ height: 88, objectFit: "contain" }} />
        ) : (
          <BrandLogo src={logoSrc} height={88} />
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
        <div style={{ display: "flex", justifyContent: layout.stampPosition === "center" ? "center" : "space-between", alignItems: "flex-end", gap: 40, maxWidth: layout.stampPosition === "center" ? 560 : "100%", margin: layout.stampPosition === "center" ? "0 auto" : undefined }}>
          <SignatureBlock certAssets={certAssets} theme={theme} size={layout.stampPosition === "prominent-right" ? "large" : "default"} />
          {layout.stampPosition === "prominent-right" ? (
            <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={136} />
          ) : layout.stampPosition === "center" ? (
            <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={120} />
          ) : (
            <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={124} />
          )}
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
  const layout = TEMPLATE_LAYOUTS[tid] || TEMPLATE_LAYOUTS[2];
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
