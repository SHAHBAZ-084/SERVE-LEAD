import {
  CERT_CANVAS,
  FONTS,
  CHAIRMAN_NAME,
  CHAIRMAN_TITLE,
  formatCertDate,
  logo,
  signatureImg,
  stampImg,
  MEMBERSHIP_TEMPLATE_ID,
} from "./CertTemplates";

export const MEMBERSHIP_CANVAS = CERT_CANVAS;

const T = {
  navy: "#002147",
  navyDeep: "#001733",
  gold: "#c5a059",
  goldDeep: "#a9803a",
  goldLight: "#e8d5a3",
  paper: "#faf9f6",
  white: "#ffffff",
  muted: "#5b6b85",
  ink: "#0f172a",
};

export function isMembershipCertificate(data) {
  if (!data) return false;
  return Number(data.templateId) === MEMBERSHIP_TEMPLATE_ID || data.customCategory === "Membership";
}

function resolveMembershipProps(data) {
  const role = data.memberId?.role || data.role || "General";
  const memberIdStr = data.member_id_str || data.memberId?.member_id || "";
  return {
    memberName: (data.memberId?.name || data.memberName || "Member Name").toUpperCase(),
    memberId: memberIdStr || "—",
    session: String(
      data.session || data.memberId?.joining_year || memberIdStr.split("-")[0] || new Date().getFullYear()
    ),
    statusLabel: role === "Executive" ? "Executive Member" : "General Member",
    membershipType: role === "Executive" ? "Executive Membership" : "General Membership",
    issueDate: formatCertDate(data.createdAt || data.issueDate, formatCertDate(new Date())),
  };
}

function CornerAccent({ corner }) {
  const pos =
    corner === "tl"
      ? { top: 18, left: 18 }
      : corner === "br"
        ? { bottom: 18, right: 18 }
        : corner === "tr"
          ? { top: 18, right: 18 }
          : { bottom: 18, left: 18 };
  const flip = corner === "br" ? "scale(-1,-1)" : corner === "tr" ? "scale(1,-1)" : corner === "bl" ? "scale(-1,1)" : "none";

  if (corner === "tl" || corner === "br") {
    return (
      <div style={{ position: "absolute", ...pos, zIndex: 3, pointerEvents: "none", transform: flip }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <polygon points="0,0 72,0 0,72" fill={T.navy} />
          <polygon points="0,0 72,0 0,72" fill="none" stroke={T.gold} strokeWidth="2" />
          <path d="M8 8 C18 6 30 14 40 26 C46 36 50 50 46 62" stroke={T.gold} strokeWidth="1.2" fill="none" opacity="0.85" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", ...pos, zIndex: 3, pointerEvents: "none" }}>
      <div style={{ width: 12, height: 12, border: `1.5px solid ${T.gold}`, opacity: 0.75, marginBottom: 3 }} />
      <div
        style={{
          width: 40,
          height: 40,
          backgroundImage: `radial-gradient(${T.gold} 1.2px, transparent 1.2px)`,
          backgroundSize: "7px 7px",
          opacity: 0.45,
        }}
      />
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
      <div style={{ width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${T.gold})` }} />
      <svg width="12" height="12" viewBox="0 0 12 12" style={{ margin: "0 4px" }}>
        <path d="M6 0 L12 6 L6 12 L0 6 Z" fill={T.gold} />
      </svg>
      <div style={{ width: 100, height: 1, background: `linear-gradient(90deg, ${T.gold}, transparent)` }} />
    </div>
  );
}

function NameDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 }}>
      <div style={{ width: 80, height: 1, background: T.gold }} />
      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0 L8 4 L4 8 L0 4 Z" fill="none" stroke={T.gold} strokeWidth="1" /></svg>
      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 5 L5 10 L0 5 Z" fill={T.gold} /></svg>
      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0 L8 4 L4 8 L0 4 Z" fill={T.navy} /></svg>
      <div style={{ width: 80, height: 1, background: T.gold }} />
    </div>
  );
}

function InfoIcon({ type }) {
  const icon =
    type === "id" ? (
      <>
        <rect x="7" y="9" width="18" height="13" rx="1.5" stroke="#fff" strokeWidth="1.3" fill="none" />
        <circle cx="12" cy="14" r="2" stroke="#fff" strokeWidth="1" fill="none" />
        <path d="M17 12h6M17 16h5" stroke="#fff" strokeWidth="1" />
      </>
    ) : type === "session" ? (
      <>
        <rect x="7" y="10" width="18" height="12" rx="1.5" stroke="#fff" strokeWidth="1.3" fill="none" />
        <path d="M11 8v3M21 8v3M7 14h18" stroke="#fff" strokeWidth="1" />
      </>
    ) : (
      <>
        <circle cx="16" cy="13" r="3.5" stroke="#fff" strokeWidth="1.3" fill="none" />
        <path d="M9 22c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#fff" strokeWidth="1.3" fill="none" />
      </>
    );

  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: T.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        {icon}
      </svg>
    </div>
  );
}

function InfoCell({ icon, label, value }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
      <InfoIcon type={icon} />
      <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.navy,
          fontFamily: FONTS.heading,
          textAlign: "center",
          wordBreak: "break-word",
          maxWidth: "100%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ChevronBanner({ children, width = "78%" }) {
  return (
    <div style={{ position: "relative", width, margin: "0 auto", height: 32 }}>
      <svg viewBox="0 0 500 32" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path d="M14 0 H486 L500 16 L486 32 H14 L0 16 Z" fill={T.navy} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function MembershipCertificateExact({ data, certAssets, id = "cert-inner" }) {
  const props = resolveMembershipProps(data || {});
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
        background: T.paper,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.body,
        color: T.navy,
      }}
    >
      {/* Subtle texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M16 2 L30 16 L16 30 L2 16 Z' fill='none' stroke='%23002147' stroke-width='0.4'/></svg>`
          )}")`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Borders */}
      <div style={{ position: "absolute", inset: 16, border: `2px solid ${T.gold}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 22, border: `1px solid ${T.navy}`, pointerEvents: "none", zIndex: 2, opacity: 0.3 }} />

      <CornerAccent corner="tl" />
      <CornerAccent corner="br" />
      <CornerAccent corner="tr" />
      <CornerAccent corner="bl" />

      <div
        style={{
          position: "relative",
          zIndex: 5,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "32px 52px 28px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <img
            src={logoSrc}
            alt="Serve & Lead Society"
            style={{ width: 220, height: "auto", maxHeight: 68, objectFit: "contain" }}
          />
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, fontWeight: 600 }}>
              Issued on
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 800, color: T.navy }}>{props.issueDate}</p>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 50,
              fontWeight: 900,
              color: T.navy,
              letterSpacing: "0.03em",
              lineHeight: 1,
            }}
          >
            CERTIFICATE
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" }}>
            OF MEMBERSHIP
          </p>
          <GoldDivider />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            lineHeight: 1.65,
            color: T.muted,
            margin: "12px auto 0",
            maxWidth: 640,
          }}
        >
          This certifies that the individual named below has been granted official membership in the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>Serve &amp; Lead Society</strong>.
        </p>

        {/* Member name */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 34,
              fontWeight: 800,
              color: T.navy,
              letterSpacing: "0.02em",
              lineHeight: 1.15,
              padding: "0 24px",
            }}
          >
            {props.memberName}
          </h2>
          <NameDivider />
        </div>

        {/* Member information */}
        <div style={{ marginTop: 14, position: "relative" }}>
          <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", zIndex: 2, width: "54%" }}>
            <ChevronBanner width="100%">
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.goldLight }}>
                Member Information
              </span>
            </ChevronBanner>
          </div>
          <div
            style={{
              border: `1.5px solid ${T.gold}`,
              borderRadius: 10,
              padding: "24px 28px 16px",
              marginTop: 6,
              background: "rgba(255,255,255,0.55)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
              <InfoCell icon="id" label="Membership ID" value={props.memberId} />
              <InfoCell icon="session" label="Membership Session" value={props.session} />
              <InfoCell icon="status" label="Status" value={props.statusLabel} />
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            lineHeight: 1.7,
            color: T.muted,
            margin: "12px auto 0",
            maxWidth: 700,
            padding: "0 16px",
          }}
        >
          This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
          privileges and responsibilities associated with the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>{props.membershipType}</strong>.
        </p>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M5 0 L6.2 3.8 L10 4 L7 6.5 L8 10 L5 8 L2 10 L3 6.5 L0 4 L3.8 3.8 Z" fill={T.gold} />
            </svg>
            <ChevronBanner width="74%">
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: T.goldLight }}>
                Together We Serve, Together We Lead
              </span>
            </ChevronBanner>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M5 0 L6.2 3.8 L10 4 L7 6.5 L8 10 L5 8 L2 10 L3 6.5 L0 4 L3.8 3.8 Z" fill={T.gold} />
            </svg>
          </div>
          <p style={{ textAlign: "center", fontSize: 9, color: T.navy, margin: "8px 0 0", opacity: 0.85 }}>
            Verify Membership: serveandlead.org | By Membership ID
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 }}>
          <div>
            <div style={{ height: 52, display: "flex", alignItems: "flex-end" }}>
              <img src={sigSrc} alt="Signature" style={{ height: 46, objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <div style={{ width: 180, height: 1.5, background: T.navy, marginTop: 2 }} />
            <p style={{ margin: "6px 0 0", fontFamily: FONTS.heading, fontSize: 13, fontWeight: 800, color: T.navy }}>
              {CHAIRMAN_NAME}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10.5, color: T.navy }}>{CHAIRMAN_TITLE}</p>
          </div>
          <img
            src={stampSrc}
            alt="Verified stamp"
            style={{
              width: 100,
              height: 100,
              objectFit: "contain",
              transform: "rotate(-12deg)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
