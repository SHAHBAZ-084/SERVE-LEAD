import membershipBg from "../assets/membership-cert-bg.png";
import {
  FONTS,
  CHAIRMAN_NAME,
  CHAIRMAN_TITLE,
  MEMBERSHIP_TEMPLATE_ID,
} from "./CertTemplates";

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
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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

/** Tiny paper backing only behind glyph bounds — no full-width bands */
function TextSlot({ children, boxStyle, textStyle }) {
  return (
    <div style={{ position: "absolute", zIndex: 2, display: "flex", justifyContent: "center", ...boxStyle }}>
      <span
        style={{
          display: "inline-block",
          background: T.paper,
          color: T.navy,
          margin: 0,
          boxSizing: "border-box",
          ...textStyle,
        }}
      >
        {children}
      </span>
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
      <TextSlot
        boxStyle={{ top: "7.05%", right: "3.8%", justifyContent: "flex-end", width: "22%" }}
        textStyle={{ fontSize: 11, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap", padding: "0 2px" }}
      >
        Issued on: {props.issueDate}
      </TextSlot>

      <TextSlot
        boxStyle={{ top: "32.95%", left: 0, right: 0 }}
        textStyle={{
          fontFamily: FONTS.heading,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          padding: "0 6px",
          textAlign: "center",
          maxWidth: "78%",
        }}
      >
        {props.memberName}
      </TextSlot>

      <TextSlot
        boxStyle={{ top: "48.25%", left: "50%", transform: "translateX(-50%)", width: "22%" }}
        textStyle={{ fontSize: 10, fontWeight: 600, color: T.muted, padding: "0 3px", textAlign: "center" }}
      >
        Membership Session
      </TextSlot>

      <TextSlot
        boxStyle={{ top: "54.55%", left: "8.6%", width: "24.4%" }}
        textStyle={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, padding: "0 4px", textAlign: "center" }}
      >
        {props.memberId}
      </TextSlot>
      <TextSlot
        boxStyle={{ top: "54.55%", left: "50%", transform: "translateX(-50%)", width: "14.5%" }}
        textStyle={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, padding: "0 3px", textAlign: "center" }}
      >
        {props.session}
      </TextSlot>
      <TextSlot
        boxStyle={{ top: "54.55%", left: "67%", width: "24.4%" }}
        textStyle={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, padding: "0 4px", textAlign: "center" }}
      >
        {props.statusLabel}
      </TextSlot>

      <TextSlot
        boxStyle={{ top: "61.2%", left: "13%", width: "74%" }}
        textStyle={{
          display: "block",
          width: "100%",
          fontFamily: FONTS.body,
          fontSize: 10.5,
          lineHeight: 1.65,
          fontWeight: 500,
          padding: "2px 6px",
          textAlign: "center",
          overflowWrap: "break-word",
          wordWrap: "break-word",
        }}
      >
        This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
        privileges and responsibilities associated with the{" "}
        <strong style={{ fontWeight: 800 }}>{props.membershipType}</strong>.
      </TextSlot>

      <span style={{ position: "absolute", opacity: 0, pointerEvents: "none", fontSize: 1 }}>
        {CHAIRMAN_NAME} {CHAIRMAN_TITLE}
      </span>
    </div>
  );
}
