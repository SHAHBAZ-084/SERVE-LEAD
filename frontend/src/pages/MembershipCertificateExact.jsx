import {
  CERT_CANVAS,
  FONTS,
  CHAIRMAN_NAME,
  CHAIRMAN_TITLE,
  formatCertDate,
  MEMBERSHIP_TEMPLATE_ID,
} from "./CertTemplates";

export const MEMBERSHIP_CANVAS = CERT_CANVAS;

const T = {
  navy: "#002147",
  navyDeep: "#001733",
  navySoft: "#0a3366",
  gold: "#c5a059",
  goldDeep: "#9a7838",
  goldLight: "#e8d5a3",
  goldPale: "#f3ead0",
  paper: "#faf8f4",
  paperDeep: "#f0ebe3",
  white: "#ffffff",
  muted: "#5b6b85",
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
      ? { top: 14, left: 14 }
      : corner === "br"
        ? { bottom: 14, right: 14 }
        : corner === "tr"
          ? { top: 14, right: 14 }
          : { bottom: 14, left: 14 };
  const flip =
    corner === "br" ? "scale(-1,-1)" : corner === "tr" ? "scale(1,-1)" : corner === "bl" ? "scale(-1,1)" : "none";

  if (corner === "tl" || corner === "br") {
    return (
      <div style={{ position: "absolute", ...pos, zIndex: 4, pointerEvents: "none", transform: flip }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <polygon points="0,0 88,0 0,88" fill={T.navy} />
          <polygon points="0,0 88,0 0,88" fill="none" stroke={T.gold} strokeWidth="2.5" />
          <path
            d="M8 8 C20 5 34 14 44 28 C50 40 54 56 48 72 M10 14 C22 20 30 34 26 50"
            stroke={T.gold}
            strokeWidth="1.3"
            fill="none"
            opacity="0.9"
          />
          <circle cx="14" cy="14" r="3" fill={T.gold} opacity="0.75" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", ...pos, zIndex: 4, pointerEvents: "none" }}>
      <div style={{ width: 14, height: 14, border: `1.5px solid ${T.gold}`, opacity: 0.8, marginBottom: 4 }} />
      <div
        style={{
          width: 46,
          height: 46,
          backgroundImage: `radial-gradient(${T.gold} 1.4px, transparent 1.4px)`,
          backgroundSize: "8px 8px",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function GoldRule({ width = 120 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
      <div style={{ width, height: 1, background: `linear-gradient(90deg, transparent, ${T.goldDeep}, ${T.gold})` }} />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 0 L14 7 L7 14 L0 7 Z" fill={T.gold} />
        <path d="M7 2.5 L11.5 7 L7 11.5 L2.5 7 Z" fill={T.goldPale} />
      </svg>
      <div style={{ width, height: 1, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDeep}, transparent)` }} />
    </div>
  );
}

function NameOrnament() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
      <div style={{ width: 90, height: 1.5, background: T.gold }} />
      <svg width="9" height="9" viewBox="0 0 9 9">
        <path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5 Z" fill="none" stroke={T.gold} strokeWidth="1" />
      </svg>
      <svg width="11" height="11" viewBox="0 0 11 11">
        <path d="M5.5 0 L11 5.5 L5.5 11 L0 5.5 Z" fill={T.gold} />
      </svg>
      <svg width="9" height="9" viewBox="0 0 9 9">
        <path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5 Z" fill={T.navy} />
      </svg>
      <div style={{ width: 90, height: 1.5, background: T.gold }} />
    </div>
  );
}

function InfoIcon({ type }) {
  const paths =
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
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: `linear-gradient(145deg, ${T.navySoft}, ${T.navy})`,
        boxShadow: "0 4px 10px rgba(0,33,71,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        {paths}
      </svg>
    </div>
  );
}

function InfoCell({ icon, label, value }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 0 }}>
      <InfoIcon type={icon} />
      <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.04em" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
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
    <div style={{ position: "relative", width, margin: "0 auto", height: 34, filter: "drop-shadow(0 2px 4px rgba(0,33,71,0.2))" }}>
      <svg viewBox="0 0 500 34" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a3366" />
            <stop offset="100%" stopColor={T.navy} />
          </linearGradient>
        </defs>
        <path d="M14 0 H486 L500 17 L486 34 H14 L0 17 Z" fill="url(#bannerGrad)" />
        <path d="M14 0 H486 L500 17 L486 34 H14 L0 17 Z" fill="none" stroke={T.gold} strokeWidth="0.6" opacity="0.45" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

export default function MembershipCertificateExact({ data, certAssets, id = "cert-inner" }) {
  const props = resolveMembershipProps(data || {});
  const logoSrc = certAssets?.logo || "/logo-certificate.png";
  const sigSrc = certAssets?.signature || "/signature.png";
  const stampSrc = "/stamp.png";

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: CERT_CANVAS.width,
        height: CERT_CANVAS.height,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.body,
        color: T.navy,
        background: `radial-gradient(ellipse 120% 80% at 50% 0%, ${T.white} 0%, ${T.paper} 45%, ${T.paperDeep} 100%)`,
      }}
    >
      {/* Paper grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 2 L38 20 L20 38 L2 20 Z' fill='none' stroke='%23002147' stroke-width='0.5'/></svg>`
          )}")`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,33,71,0.04) 100%)",
        }}
      />

      {/* Borders */}
      <div
        style={{
          position: "absolute",
          inset: 14,
          border: `2.5px solid ${T.gold}`,
          pointerEvents: "none",
          zIndex: 2,
          boxShadow: "inset 0 0 0 1px rgba(197,160,89,0.3)",
        }}
      />
      <div style={{ position: "absolute", inset: 21, border: `1px solid ${T.navy}`, pointerEvents: "none", zIndex: 2, opacity: 0.35 }} />

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
          padding: "30px 56px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div
            style={{
              flex: "0 0 auto",
              padding: "4px 0",
              lineHeight: 0,
            }}
          >
            <img
              src={logoSrc}
              alt="Serve & Lead Society"
              crossOrigin="anonymous"
              style={{
                display: "block",
                width: 300,
                height: "auto",
                maxHeight: 86,
                objectFit: "contain",
                objectPosition: "left center",
                mixBlendMode: "multiply",
                filter: "contrast(1.08) saturate(1.05)",
              }}
            />
          </div>

          <div
            style={{
              textAlign: "right",
              padding: "10px 16px",
              border: `1px solid ${T.gold}`,
              borderRadius: 6,
              background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(243,234,208,0.35))",
              boxShadow: "0 2px 8px rgba(0,33,71,0.06)",
              minWidth: 148,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 8.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.muted,
                fontWeight: 700,
              }}
            >
              Issued on
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 13, fontWeight: 800, color: T.navy, fontFamily: FONTS.heading }}>
              {props.issueDate}
            </p>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 54,
              fontWeight: 900,
              color: T.navy,
              letterSpacing: "0.04em",
              lineHeight: 1,
              textShadow: "0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            CERTIFICATE
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: T.navy,
            }}
          >
            OF MEMBERSHIP
          </p>
          <GoldRule width={130} />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: T.muted,
            margin: "14px auto 0",
            maxWidth: 660,
          }}
        >
          This certifies that the individual named below has been granted official membership in the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>Serve &amp; Lead Society</strong>.
        </p>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 36,
              fontWeight: 800,
              color: T.navy,
              letterSpacing: "0.03em",
              lineHeight: 1.12,
              padding: "0 20px",
            }}
          >
            {props.memberName}
          </h2>
          <NameOrnament />
        </div>

        {/* Member information */}
        <div style={{ marginTop: 16, position: "relative" }}>
          <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", zIndex: 3, width: "56%" }}>
            <ChevronBanner width="100%">
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: T.goldLight }}>
                Member Information
              </span>
            </ChevronBanner>
          </div>
          <div
            style={{
              border: `2px solid ${T.gold}`,
              borderRadius: 12,
              padding: "28px 32px 18px",
              marginTop: 8,
              background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(250,248,244,0.95) 100%)",
              boxShadow: "0 6px 20px rgba(0,33,71,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start" }}>
              <InfoCell icon="id" label="Membership ID" value={props.memberId} />
              <InfoCell icon="session" label="Membership Session" value={props.session} />
              <InfoCell icon="status" label="Status" value={props.statusLabel} />
            </div>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 11.5,
            lineHeight: 1.75,
            color: T.muted,
            margin: "14px auto 0",
            maxWidth: 720,
            padding: "0 12px",
          }}
        >
          This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
          privileges and responsibilities associated with the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>{props.membershipType}</strong>.
        </p>

        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <svg width="11" height="11" viewBox="0 0 11 11">
              <path d="M5.5 0 L6.8 4.2 L11 4.4 L7.7 7.1 L8.8 11 L5.5 8.8 L2.2 11 L3.3 7.1 L0 4.4 L4.2 4.2 Z" fill={T.gold} />
            </svg>
            <ChevronBanner width="76%">
              <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: T.goldLight }}>
                Together We Serve, Together We Lead
              </span>
            </ChevronBanner>
            <svg width="11" height="11" viewBox="0 0 11 11">
              <path d="M5.5 0 L6.8 4.2 L11 4.4 L7.7 7.1 L8.8 11 L5.5 8.8 L2.2 11 L3.3 7.1 L0 4.4 L4.2 4.2 Z" fill={T.gold} />
            </svg>
          </div>
          <p style={{ textAlign: "center", fontSize: 9.5, color: T.navy, margin: "10px 0 0", opacity: 0.88, letterSpacing: "0.02em" }}>
            Verify Membership: serveandlead.org | By Membership ID
          </p>
        </div>

        {/* Footer — signature & stamp */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "end",
            gap: 24,
            marginTop: 14,
            paddingTop: 4,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                height: 78,
                minWidth: 260,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                paddingBottom: 0,
              }}
            >
              <img
                src={sigSrc}
                alt="Chairman signature"
                crossOrigin="anonymous"
                style={{
                  display: "block",
                  height: 72,
                  width: "auto",
                  minWidth: 220,
                  maxWidth: 300,
                  objectFit: "contain",
                  objectPosition: "left bottom",
                  mixBlendMode: "multiply",
                  filter: "contrast(1.2)",
                }}
              />
            </div>
            <div
              style={{
                width: 220,
                height: 2,
                background: `linear-gradient(90deg, ${T.navy}, ${T.navySoft})`,
                marginTop: 4,
                borderRadius: 1,
              }}
            />
            <p style={{ margin: "8px 0 0", fontFamily: FONTS.heading, fontSize: 14, fontWeight: 800, color: T.navy }}>
              {CHAIRMAN_NAME}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: T.navy, fontWeight: 500 }}>{CHAIRMAN_TITLE}</p>
          </div>

          <div
            style={{
              width: 128,
              height: 128,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              marginBottom: 6,
              flexShrink: 0,
            }}
          >
            <img
              src={stampSrc}
              alt="Official verified stamp"
              crossOrigin="anonymous"
              style={{
                display: "block",
                width: 120,
                height: 120,
                objectFit: "contain",
                transform: "rotate(-14deg)",
                filter: "contrast(1.1) saturate(1.15)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
