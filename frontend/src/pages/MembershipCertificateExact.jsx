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
    memberName: (data.memberId?.name || data.memberName || "Member Name").toUpperCase(),
    memberId: memberIdStr || "20XX-SLS-XXXX",
    session: String(
      data.session || data.memberId?.joining_year || memberIdStr.split("-")[0] || new Date().getFullYear()
    ),
    statusLabel: role === "Executive" ? "Executive Member" : "General Member",
    membershipType: role === "Executive" ? "Executive Membership" : "General Membership",
    issueDate: formatMembershipDate(data.createdAt || data.issueDate, formatMembershipDate(new Date())),
  };
}

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
    <div style={{ position: "absolute", zIndex: 2, color: T.navy, margin: 0, ...style }}>
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
      {/* Issued date */}
      <ErasePatch top="6.8%" right="4.4%" width="16%" height="3.6%" />
      <OverlayText
        style={{
          top: "7.05%",
          right: "4.4%",
          fontSize: 11,
          fontWeight: 600,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        Issued on: {props.issueDate}
      </OverlayText>

      {/* Member name */}
      <ErasePatch centerX="50%" top="32.2%" width="66%" height="6.5%" />
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
          padding: "0 7%",
        }}
      >
        {props.memberName}
      </OverlayText>

      {/* Member info values */}
      <ErasePatch left="9.5%" top="53.8%" width="22%" height="3.8%" />
      <ErasePatch centerX="50%" top="53.8%" width="14%" height="3.8%" />
      <ErasePatch right="9.5%" top="53.8%" width="22%" height="3.8%" />

      <OverlayText
        style={{
          top: "54.55%",
          left: "9.5%",
          width: "22%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.memberId}
      </OverlayText>
      <OverlayText
        style={{
          top: "54.55%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "14%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.session}
      </OverlayText>
      <OverlayText
        style={{
          top: "54.55%",
          right: "9.5%",
          width: "22%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.statusLabel}
      </OverlayText>

      {/* Full closing paragraph */}
      <ErasePatch centerX="50%" top="60.8%" width="80%" height="8.5%" />
      <OverlayText
        style={{
          top: "61.2%",
          left: "10%",
          right: "10%",
          textAlign: "center",
          fontFamily: FONTS.body,
          fontSize: 10.5,
          lineHeight: 1.65,
          color: T.navy,
          fontWeight: 500,
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
