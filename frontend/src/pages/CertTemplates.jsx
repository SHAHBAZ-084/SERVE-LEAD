import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";

export { logo, sealImg };

/** Site brand palette — matches Tailwind navy (#002147) + cyan accents used across the app */
export const CERT_THEME = {
  navy: "#002147",
  navyDark: "#001733",
  navyMid: "#003366",
  cyan: "#22d3ee",
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
};

export const CHAIRMAN_NAME = "M Farooq Ahmad";
export const CHAIRMAN_TITLE = "Chairman SLS";

export const CERT_CANVAS = { width: 1123, height: 794 };

export const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

/** Metadata for admin/member template pickers — keep ids 1–7 in sync everywhere */
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

export const VerifiedStamp = ({ color = CERT_THEME.navy, id = "stamp", size = 118, imageSrc }) => {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt="Verified"
        style={{ width: size, height: size, objectFit: "contain", display: "block", transform: "rotate(-6deg)" }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: "block", transform: "rotate(-6deg)" }}>
      <circle cx="60" cy="60" r="53" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.85" />
      <circle cx="60" cy="60" r="49" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.7" />
      <circle cx="60" cy="60" r="37" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.8" />
      <rect x="15" y="47" width="90" height="26" fill="#ffffff" stroke={color} strokeWidth="1.8" rx="2.5" />
      <text x="60" y="65" fontFamily={FONTS.body} fontSize="13" fontWeight="900" fill={color} textAnchor="middle" letterSpacing="1">
        VERIFIED
      </text>
      <text x="60" y="43" fontFamily={FONTS.body} fontSize="7" fill={color} textAnchor="middle" letterSpacing="3">
        ★★★
      </text>
      <text x="60" y="80" fontFamily={FONTS.body} fontSize="7" fill={color} textAnchor="middle" letterSpacing="3">
        ★★★
      </text>
      <path id={`stamp-top-${id}`} d="M 23 60 A 37 37 0 0 1 97 60" fill="none" />
      <path id={`stamp-bottom-${id}`} d="M 97 60 A 37 37 0 0 1 23 60" fill="none" />
      <text fontSize="7.5" fontWeight="950" fontFamily={FONTS.body} fill={color} letterSpacing="1.2">
        <textPath href={`#stamp-top-${id}`} startOffset="50%" textAnchor="middle">
          SERVE & LEAD
        </textPath>
      </text>
      <text fontSize="7.5" fontWeight="950" fontFamily={FONTS.body} fill={color} letterSpacing="1.2">
        <textPath href={`#stamp-bottom-${id}`} startOffset="50%" textAnchor="middle">
          SOCIETY
        </textPath>
      </text>
    </svg>
  );
};

function Decorations({ layout, theme }) {
  const { accentStyle } = layout;

  if (accentStyle === "classic") {
    return (
      <>
        <div style={{ position: "absolute", inset: 16, border: `2px solid ${theme.navy}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 22, border: `1px solid ${theme.navy}`, opacity: 0.45, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 140, height: 140, background: `linear-gradient(135deg, ${theme.cyan}22 0%, transparent 60%)`, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "minimal") {
    return (
      <>
        <div style={{ position: "absolute", inset: 24, border: `1px solid ${theme.slate200}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 32, left: 32, width: 48, height: 48, borderTop: `3px solid ${theme.cyanDeep}`, borderLeft: `3px solid ${theme.cyanDeep}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 32, right: 32, width: 48, height: 48, borderBottom: `3px solid ${theme.cyanDeep}`, borderRight: `3px solid ${theme.cyanDeep}`, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "gold") {
    return (
      <>
        <div style={{ position: "absolute", inset: 14, border: `3px solid ${theme.gold}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 22, border: `1px solid ${theme.navy}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 220, height: 6, background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)` }} />
      </>
    );
  }

  if (accentStyle === "corporate") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, background: theme.navy, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 72, left: 0, right: 0, height: 4, background: theme.cyan, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: theme.slate50, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "elegant") {
    return (
      <>
        <div style={{ position: "absolute", inset: 18, border: `1px solid ${theme.navy}`, opacity: 0.35, pointerEvents: "none" }} />
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
          const pos = {
            "top-left": { top: 12, left: 12 },
            "top-right": { top: 12, right: 12 },
            "bottom-left": { bottom: 12, left: 12 },
            "bottom-right": { bottom: 12, right: 12 },
          }[corner];
          return (
            <div key={corner} style={{ position: "absolute", ...pos, width: 36, height: 36, border: `2px solid ${theme.cyanDeep}`, borderRadius: 2, pointerEvents: "none" }} />
          );
        })}
      </>
    );
  }

  if (accentStyle === "diagonal") {
    return (
      <>
        <svg style={{ position: "absolute", top: 0, right: 0, width: 320, height: 220, pointerEvents: "none" }} viewBox="0 0 320 220">
          <polygon points="320,0 180,0 320,140" fill={theme.cyan} opacity="0.85" />
          <polygon points="320,0 240,0 320,80" fill={theme.navy} opacity="0.9" />
        </svg>
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: 280, height: 180, pointerEvents: "none" }} viewBox="0 0 280 180">
          <polygon points="0,180 0,100 200,180" fill={theme.cyanDeep} opacity="0.75" />
          <polygon points="0,180 80,180 0,120" fill={theme.navy} opacity="0.85" />
        </svg>
        <div style={{ position: "absolute", inset: 20, border: `1px solid ${theme.slate200}`, pointerEvents: "none" }} />
      </>
    );
  }

  if (accentStyle === "seal") {
    return (
      <>
        <div style={{ position: "absolute", inset: 20, border: `2px solid ${theme.cyanDeep}`, borderRadius: 4, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: 80, transform: "translateY(-50%)", width: 200, height: 200, borderRadius: "50%", border: `1px dashed ${theme.cyan}55`, pointerEvents: "none" }} />
      </>
    );
  }

  return null;
}

function DefaultBody({ content, theme, layout }) {
  const { eventDate, eventTitle, description } = content;
  const accent = layout.accentColor || theme.navy;

  if (description) {
    return (
      <p style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: FONTS.body, fontSize: 13, lineHeight: 1.75, color: theme.textBody, fontStyle: "italic" }}>
        {description}
      </p>
    );
  }

  return (
    <div style={{ fontFamily: FONTS.body, fontSize: 12.5, lineHeight: 1.8, color: theme.textBody, fontStyle: "italic" }}>
      <p style={{ margin: 0 }}>has successfully participated in the online training session titled</p>
      <p style={{ margin: "6px 0", fontSize: 14, fontWeight: 700, color: accent, fontStyle: "normal" }}>
        “{eventTitle || "Orientation & How to Add References in MS Word"}”
      </p>
      {eventDate && <p style={{ margin: 0 }}>held on {eventDate}.</p>}
      <p style={{ margin: "10px 0 0", fontSize: 11.5, color: theme.textMuted }}>
        The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session.
      </p>
      <p style={{ margin: "4px 0", fontSize: 11.5, fontWeight: 700, color: theme.text, fontStyle: "normal" }}>
        This certificate is issued only after the successful submission of the required assessment.
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: theme.textMuted }}>
        We appreciate the participant&apos;s commitment to academic excellence and continuous learning.
      </p>
    </div>
  );
}

function SignatureBlock({ certAssets, theme, compact }) {
  const sigH = compact ? 52 : 58;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: 180 }}>
      <div style={{ height: 68, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
        <img
          src={certAssets?.signature || "/signature.png"}
          alt="Signature"
          style={{ height: sigH, objectFit: "contain", maxWidth: 200 }}
        />
      </div>
      <div style={{ width: 170, height: 1, backgroundColor: theme.text, marginBottom: 6 }} />
      <p style={{ fontWeight: 700, fontSize: 13, color: theme.text, margin: 0, fontFamily: FONTS.body }}>{CHAIRMAN_NAME}</p>
      <p style={{ fontSize: 10.5, color: theme.textMuted, margin: 0, fontStyle: "italic", fontFamily: FONTS.body }}>{CHAIRMAN_TITLE}</p>
    </div>
  );
}

export function CertificateBase({ data, certAssets, id = "cert-inner", layout }) {
  const theme = CERT_THEME;
  const content = resolveCertificateContent(data);
  const isCorporate = layout.accentStyle === "corporate";
  const logoSrc = certAssets?.logo || logo;
  const stampSrc = certAssets?.stamp || certAssets?.seal || "/stamp.png";

  const titleColor = isCorporate ? theme.white : layout.accentColor || theme.navy;
  const headerTop = isCorporate ? 88 : layout.logoPosition === "center" ? 48 : 44;

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

      {/* Header row */}
      <header
        style={{
          position: "relative",
          zIndex: 2,
          padding: isCorporate ? "88px 48px 0" : layout.logoPosition === "center" ? "40px 48px 0" : "40px 48px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: layout.logoPosition === "center" ? "center" : "flex-start",
        }}
      >
        <div style={{ marginTop: 0 }}>
          <img src={logoSrc} alt="Serve & Lead Society" style={{ height: isCorporate ? 56 : 68, objectFit: "contain" }} />
        </div>
        {layout.issueDateVisible && (
          <p
            style={{
              marginTop: 10,
              fontSize: 11,
              color: isCorporate ? theme.white : theme.textBody,
              opacity: isCorporate ? 0.85 : 1,
              fontFamily: FONTS.body,
            }}
          >
            Date of Issue: {content.issueDate}
          </p>
        )}
      </header>

      {/* Main content — flex-centered in remaining space */}
      <main
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: layout.accentStyle === "seal" ? "0 320px 0 64px" : "0 72px",
          marginTop: layout.logoPosition === "center" ? -8 : headerTop - 40,
        }}
      >
        {layout.titleMode === "combined" ? (
          <h1
            style={{
              fontFamily: FONTS.heading,
              fontSize: 38,
              fontWeight: 900,
              color: layout.accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {content.titleLine}
            <span style={{ display: "block", fontSize: 22, fontWeight: 700, marginTop: 6, fontStyle: "italic", textTransform: "none" }}>
              {content.awardType}
            </span>
          </h1>
        ) : (
          <>
            <h1
              style={{
                fontFamily: FONTS.heading,
                fontSize: layout.accentStyle === "minimal" ? 48 : 52,
                fontWeight: 900,
                color: titleColor === theme.white ? theme.navy : titleColor,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1,
                margin: 0,
              }}
            >
              {content.titleLine}
            </h1>
            <p
              style={{
                fontFamily: FONTS.heading,
                fontSize: 22,
                color: layout.accentStyle === "gold" ? theme.gold : theme.navyMid,
                margin: "10px 0 0",
                fontStyle: "italic",
                fontWeight: 700,
              }}
            >
              {content.awardType}
            </p>
          </>
        )}

        <p style={{ fontSize: 12, fontStyle: "italic", color: theme.textMuted, marginTop: 14, letterSpacing: "0.04em" }}>
          This certificate is presented to
        </p>

        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: 36,
            fontWeight: 700,
            color: theme.text,
            margin: "28px 0 0",
            paddingBottom: 8,
            borderBottom: `2px solid ${layout.borderColor || theme.navy}`,
            minWidth: 420,
            maxWidth: "90%",
          }}
        >
          {content.memberName}
        </h2>

        <div style={{ marginTop: 28, maxWidth: 780, width: "100%" }}>
          <DefaultBody content={content} theme={theme} layout={layout} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 2, padding: "0 48px 36px" }}>
        {layout.stampPosition === "prominent-right" ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <SignatureBlock certAssets={certAssets} theme={theme} />
            <div style={{ marginRight: 40, marginBottom: 8 }}>
              <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={130} imageSrc={stampSrc} />
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: layout.stampPosition === "center" ? "center" : "space-between",
              alignItems: "flex-end",
              gap: 48,
              maxWidth: layout.stampPosition === "center" ? 520 : "100%",
              margin: layout.stampPosition === "center" ? "0 auto" : undefined,
            }}
          >
            <SignatureBlock certAssets={certAssets} theme={theme} compact={layout.stampPosition === "center"} />
            {layout.stampPosition !== "center" && (
              <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={112} imageSrc={stampSrc} />
            )}
            {layout.stampPosition === "center" && (
              <VerifiedStamp color={theme.navy} id={`${id}-stamp`} size={100} imageSrc={stampSrc} />
            )}
          </div>
        )}

        <p
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 10,
            color: theme.textMuted,
            fontStyle: "italic",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          Verify Through SLS Website by Using Membership ID
        </p>
      </footer>
    </div>
  );
}

export function RenderCertificate({ templateId = 1, data, certAssets, id = "cert-inner" }) {
  const layout = TEMPLATE_LAYOUTS[Number(templateId)] || TEMPLATE_LAYOUTS[1];
  return <CertificateBase data={data} certAssets={certAssets} id={id} layout={layout} />;
}

/** Backward-compatible named exports (ids 1–3 map to first three layouts; 4–7 use registry) */
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
