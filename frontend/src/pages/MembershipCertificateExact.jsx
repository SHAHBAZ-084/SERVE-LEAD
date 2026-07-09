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

const T = {
  navy: "#002147",
  navyDeep: "#0d3b66",
  gold: "#c8a951",
  goldDeep: "#a9803a",
  goldLight: "#e8d5a3",
  paper: "#faf9f6",
  white: "#ffffff",
  text: "#0f172a",
  muted: "#475569",
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
    memberId: memberIdStr || "20XX-SLS-XXXX",
    session: String(
      data.session || data.memberId?.joining_year || memberIdStr.split("-")[0] || new Date().getFullYear()
    ),
    statusLabel: role === "Executive" ? "Executive Member" : "General Member",
    roleWord: role === "Executive" ? "Executive" : "General",
    issueDate: formatCertDate(data.createdAt || data.issueDate, formatCertDate(new Date())),
  };
}

function DiamondWatermark() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20 2 L38 20 L20 38 L2 20 Z' fill='none' stroke='%23002147' stroke-width='0.6'/></svg>`
        )}")`,
        backgroundSize: "40px 40px",
      }}
    />
  );
}

function CornerFlourish({ flipX = false, flipY = false }) {
  const transform = `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`;
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      style={{ position: "absolute", transform, pointerEvents: "none" }}
      fill="none"
    >
      <path
        d="M8 8 C20 4, 34 10, 44 22 C52 32, 58 48, 54 62"
        stroke={T.gold}
        strokeWidth="1.4"
        opacity="0.9"
      />
      <path
        d="M12 14 C22 12, 30 18, 36 28"
        stroke={T.goldDeep}
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="10" cy="10" r="2.5" fill={T.gold} opacity="0.85" />
      <path d="M48 50 L58 62 L52 62 L44 54 Z" fill={T.gold} opacity="0.55" />
    </svg>
  );
}

function DottedCorner({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 56,
        height: 56,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(${T.gold} 1.2px, transparent 1.2px)`,
        backgroundSize: "7px 7px",
        opacity: 0.55,
        ...style,
      }}
    />
  );
}

function NavyRibbon({ children, style = {} }) {
  return (
    <div style={{ position: "relative", width: "78%", margin: "0 auto", height: 34, ...style }}>
      <svg viewBox="0 0 520 34" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path d="M18 0 H502 L520 17 L502 34 H18 L0 17 Z" fill={T.navy} />
        <path d="M18 0 H502 L520 17 L502 34 H18 L0 17 Z" fill="none" stroke={T.gold} strokeWidth="0.6" opacity="0.45" />
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

function GoldNameDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
      <div style={{ width: 120, height: 1, background: `linear-gradient(90deg, transparent, ${T.goldDeep})` }} />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 0 L14 7 L7 14 L0 7 Z" fill={T.gold} />
        <path d="M7 3 L11 7 L7 11 L3 7 Z" fill={T.goldLight} />
      </svg>
      <div style={{ width: 8, height: 8, border: `1px solid ${T.goldDeep}`, transform: "rotate(45deg)" }} />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 0 L14 7 L7 14 L0 7 Z" fill={T.gold} />
        <path d="M7 3 L11 7 L7 11 L3 7 Z" fill={T.goldLight} />
      </svg>
      <div style={{ width: 120, height: 1, background: `linear-gradient(90deg, ${T.goldDeep}, transparent)` }} />
    </div>
  );
}

function TitleDiamond() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 0 L12 6 L6 12 L0 6 Z" fill={T.gold} />
      </svg>
    </div>
  );
}

function InfoBadge({ type }) {
  const icon =
    type === "id" ? (
      <>
        <rect x="7" y="9" width="18" height="14" rx="2" fill="#fff" opacity="0.15" />
        <rect x="7" y="9" width="18" height="14" rx="2" stroke="#fff" strokeWidth="1.4" fill="none" />
        <circle cx="13" cy="15" r="2.5" stroke="#fff" strokeWidth="1.2" fill="none" />
        <path d="M19 13h5M19 17h5" stroke="#fff" strokeWidth="1.2" />
      </>
    ) : type === "session" ? (
      <>
        <rect x="7" y="10" width="18" height="14" rx="2" stroke="#fff" strokeWidth="1.4" fill="none" />
        <path d="M12 8v4M20 8v4M7 14h18" stroke="#fff" strokeWidth="1.2" />
      </>
    ) : (
      <>
        <circle cx="16" cy="13" r="4" stroke="#fff" strokeWidth="1.4" fill="none" />
        <path d="M10 24c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#fff" strokeWidth="1.4" fill="none" />
      </>
    );

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: T.navy,
        border: `2px solid ${T.gold}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,33,71,0.25)",
        flexShrink: 0,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        {icon}
      </svg>
    </div>
  );
}

function InfoColumn({ badge, label, value }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
      <InfoBadge type={badge} />
      <p style={{ margin: 0, fontSize: 10, color: T.muted, fontFamily: FONTS.body, textAlign: "center" }}>{label}</p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 800,
          color: T.navy,
          fontFamily: FONTS.body,
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
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
        color: T.text,
      }}
    >
      <DiamondWatermark />

      {/* Thick navy outer + thin gold inner border */}
      <div style={{ position: "absolute", inset: 10, border: `4px solid ${T.navy}`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 18, border: `1.5px solid ${T.gold}`, pointerEvents: "none", zIndex: 2 }} />

      {/* Corner navy triangles */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          width: 0,
          height: 0,
          borderTop: `72px solid ${T.navy}`,
          borderRight: "72px solid transparent",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 0,
          height: 0,
          borderBottom: `72px solid ${T.navy}`,
          borderLeft: "72px solid transparent",
          zIndex: 3,
        }}
      />

      {/* Flourishes + dotted corners */}
      <div style={{ position: "absolute", top: 18, left: 18, zIndex: 4 }}>
        <CornerFlourish />
      </div>
      <div style={{ position: "absolute", bottom: 18, right: 18, zIndex: 4 }}>
        <CornerFlourish flipX flipY />
      </div>
      <DottedCorner style={{ top: 22, right: 22 }} />
      <DottedCorner style={{ bottom: 22, left: 22 }} />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "34px 52px 30px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <img
            src={logoSrc}
            alt="Serve & Lead Society"
            style={{ width: 240, height: "auto", maxHeight: 78, objectFit: "contain", display: "block" }}
          />
          <div style={{ textAlign: "right", paddingTop: 4 }}>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.navy,
                fontWeight: 600,
              }}
            >
              Issued on:
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 800, color: T.navy }}>{props.issueDate}</p>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 52,
              fontWeight: 900,
              color: T.navy,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            CERTIFICATE
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: T.navy,
            }}
          >
            OF MEMBERSHIP
          </p>
          <TitleDiamond />
        </div>

        {/* Body intro */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: T.muted,
            margin: "14px auto 0",
            maxWidth: 640,
          }}
        >
          This certifies that the individual named below has been granted official membership in the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>Serve & Lead Society</strong>.
        </p>

        {/* Member name */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: FONTS.heading,
              fontSize: 36,
              fontWeight: 800,
              color: T.navy,
              letterSpacing: "0.03em",
            }}
          >
            {props.memberName}
          </h2>
          <GoldNameDivider />
        </div>

        {/* Member information ribbon */}
        <div style={{ marginTop: 16 }}>
          <NavyRibbon>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: T.gold,
              }}
            >
              Member Information
            </span>
          </NavyRibbon>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              marginTop: 16,
              padding: "0 24px",
            }}
          >
            <InfoColumn badge="id" label="Membership ID" value={props.memberId} />
            <InfoColumn badge="session" label="Membership Session" value={props.session} />
            <InfoColumn badge="status" label="Status" value={props.statusLabel} />
          </div>
        </div>

        {/* Closing paragraph */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11.5,
            lineHeight: 1.75,
            color: T.muted,
            margin: "14px auto 0",
            maxWidth: 700,
          }}
        >
          This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
          privileges and responsibilities associated with the{" "}
          <strong style={{ color: T.navy, fontWeight: 800 }}>{props.roleWord}</strong> Membership.
        </p>

        {/* Bottom banner */}
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <NavyRibbon style={{ width: "88%" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: T.goldLight,
              }}
            >
              Together We Serve, Together We Lead
            </span>
          </NavyRibbon>
          <p
            style={{
              textAlign: "center",
              fontSize: 9.5,
              color: T.navy,
              margin: "10px 0 0",
              letterSpacing: "0.04em",
            }}
          >
            Verify Membership: serveandlead.org | By Membership ID
          </p>
        </div>

        {/* Footer signature + stamp */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 12,
            paddingTop: 4,
          }}
        >
          <div style={{ minWidth: 200 }}>
            <div style={{ height: 54, display: "flex", alignItems: "flex-end" }}>
              <img
                src={sigSrc}
                alt="Chairman Signature"
                style={{ height: 48, objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
            <div style={{ width: 190, height: 2, background: "#000000", marginTop: 2 }} />
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: FONTS.heading,
                fontSize: 14,
                fontWeight: 800,
                color: "#000000",
              }}
            >
              {CHAIRMAN_NAME}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: T.navy, fontWeight: 500 }}>{CHAIRMAN_TITLE}</p>
          </div>

          <img
            src={stampSrc}
            alt="Verified Stamp"
            style={{
              width: 108,
              height: 108,
              objectFit: "contain",
              transform: "rotate(-12deg)",
              filter: "contrast(1.1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
