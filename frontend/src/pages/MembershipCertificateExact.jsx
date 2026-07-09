import membershipBg from "../assets/membership-cert-bg.png";
import {
  FONTS,
  CHAIRMAN_NAME,
  CHAIRMAN_TITLE,
  MEMBERSHIP_TEMPLATE_ID,
} from "./CertTemplates";

/** Reference artboard matches membership-cert-bg.png exactly */
export const MEMBERSHIP_CANVAS = { width: 1024, height: 723 };

const T = {
  navy: "#002147",
  paper: "#FDF9F6",
  muted: "#5b6b85",
};

const BG_PATH = membershipBg;

export function isMembershipCertificate(data) {
  if (!data) return false;
  return Number(data.templateId) === MEMBERSHIP_TEMPLATE_ID || data.customCategory === "Membership";
}

function formatMembershipDate(value, fallback = "") {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

function resolveMembershipProps(data) {
  const role = data.memberId?.role || data.role || "General";
  const memberIdStr = data.member_id_str || data.memberId?.member_id || "";
  return {
    memberName: (data.memberId?.name || data.memberName || "").toUpperCase(),
    memberId: memberIdStr,
    session: String(
      data.session || data.memberId?.joining_year || memberIdStr.split("-")[0] || new Date().getFullYear()
    ),
    statusLabel: role === "Executive" ? "Executive Member" : "General Member",
    membershipType: role === "Executive" ? "Executive Membership" : "General Membership",
    issueDate: formatMembershipDate(data.createdAt || data.issueDate, formatMembershipDate(new Date())),
  };
}

/** Opaque mask — hides baked-in placeholder text from the background image */
function ErasePatch({ top, left, width, height, right, centerX }) {
  const style = {
    position: "absolute",
    top,
    width,
    height,
    background: T.paper,
    pointerEvents: "none",
    zIndex: 1,
  };
  if (centerX != null) {
    style.left = centerX;
    style.transform = "translateX(-50%)";
  } else if (right != null) {
    style.right = right;
  } else {
    style.left = left;
  }
  return <div style={style} />;
}

function OverlayText({ children, style }) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        color: T.navy,
        margin: 0,
        boxSizing: "border-box",
        background: T.paper,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function MembershipCertificateExact({ data, id = "cert-inner" }) {
  const props = resolveMembershipProps(data || {});

  return (
    <div
      id={id}
      style={{
        position: "relative",
        width: MEMBERSHIP_CANVAS.width,
        height: MEMBERSHIP_CANVAS.height,
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: FONTS.body,
        backgroundColor: T.paper,
        backgroundImage: `url(${BG_PATH})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Issued date — mask baked-in "Issued on: 12/12/2026" */}
      <ErasePatch top="6.2%" right="3.8%" width="22%" height="4.2%" />
      <OverlayText
        style={{
          top: "7.05%",
          right: "3.8%",
          fontSize: 11,
          fontWeight: 600,
          textAlign: "right",
          whiteSpace: "nowrap",
          padding: "1px 4px",
        }}
      >
        Issued on: {props.issueDate}
      </OverlayText>

      {/* Member name — mask baked-in "MEMBER NAME" */}
      <ErasePatch centerX="50%" top="31.8%" width="74%" height="9.2%" />
      <OverlayText
        style={{
          top: "32.95%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          padding: "2px 13%",
        }}
      >
        {props.memberName}
      </OverlayText>

      {/* Session label typo in background — "Membershin Session" */}
      <ErasePatch centerX="50%" top="48.1%" width="22%" height="2.4%" />
      <OverlayText
        style={{
          top: "48.25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "22%",
          textAlign: "center",
          fontSize: 10,
          fontWeight: 600,
          color: T.muted,
          padding: "1px 2px",
        }}
      >
        Membership Session
      </OverlayText>

      {/* Member info values — mask baked-in "20XX-SLS-XXXX", "20XX", "General Member" */}
      <ErasePatch left="7%" top="53.1%" width="28%" height="4.5%" />
      <ErasePatch centerX="50%" top="53.1%" width="16%" height="4.5%" />
      <ErasePatch right="7%" top="53.1%" width="28%" height="4.5%" />

      <OverlayText
        style={{
          top: "54.55%",
          left: "7%",
          width: "28%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
          padding: "1px 6px",
        }}
      >
        {props.memberId}
      </OverlayText>
      <OverlayText
        style={{
          top: "54.55%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "16%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
          padding: "1px 4px",
        }}
      >
        {props.session}
      </OverlayText>
      <OverlayText
        style={{
          top: "54.55%",
          right: "7%",
          width: "28%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
          padding: "1px 6px",
        }}
      >
        {props.statusLabel}
      </OverlayText>

      {/* Closing paragraph — mask baked-in placeholder paragraph */}
      <ErasePatch centerX="50%" top="60.5%" width="84%" height="10.5%" />
      <OverlayText
        style={{
          top: "61.2%",
          left: "13%",
          width: "74%",
          textAlign: "center",
          fontFamily: FONTS.body,
          fontSize: 10.5,
          lineHeight: 1.65,
          color: T.navy,
          fontWeight: 500,
          overflow: "visible",
          overflowWrap: "break-word",
          wordWrap: "break-word",
          padding: "2px 8px",
        }}
      >
        This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
        privileges and responsibilities associated with the{" "}
        <strong style={{ color: T.navy, fontWeight: 800 }}>{props.membershipType}</strong>.
      </OverlayText>

      <span style={{ position: "absolute", opacity: 0, pointerEvents: "none", fontSize: 1 }}>
        {CHAIRMAN_NAME} {CHAIRMAN_TITLE}
      </span>
    </div>
  );
}
