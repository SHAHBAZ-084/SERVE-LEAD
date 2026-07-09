import membershipBg from "../assets/membership-cert-bg-clean.png";
import {
  FONTS,
  CHAIRMAN_NAME,
  CHAIRMAN_TITLE,
  MEMBERSHIP_TEMPLATE_ID,
} from "./CertTemplates";

export const MEMBERSHIP_CANVAS = { width: 1024, height: 723 };

const T = { navy: "#002147", muted: "#5b6b85" };

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

function Field({ children, style }) {
  return (
    <div style={{ position: "absolute", zIndex: 2, color: T.navy, margin: 0, boxSizing: "border-box", ...style }}>
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
        backgroundColor: "#FDF9F6",
        backgroundImage: `url(${membershipBg})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Field
        style={{
          top: "6.64%",
          right: "7.5%",
          fontSize: 11,
          fontWeight: 600,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        Issued on: {props.issueDate}
      </Field>

      <Field
        style={{
          top: "32.92%",
          left: "29.4%",
          width: "42%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
        }}
      >
        {props.memberName}
      </Field>

      <Field
        style={{
          top: "55.3%",
          left: "20.9%",
          width: "12.1%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.memberId}
      </Field>
      <Field
        style={{
          top: "55.3%",
          left: "41.6%",
          width: "8.8%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.session}
      </Field>
      <Field
        style={{
          top: "55.3%",
          left: "63.1%",
          width: "15.6%",
          textAlign: "center",
          fontFamily: FONTS.heading,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {props.statusLabel}
      </Field>

      <Field
        style={{
          top: "61.8%",
          left: "12.3%",
          width: "75.2%",
          textAlign: "center",
          fontFamily: FONTS.body,
          fontSize: 10.5,
          lineHeight: 1.65,
          fontWeight: 500,
          overflowWrap: "break-word",
          wordWrap: "break-word",
        }}
      >
        This certificate is valid until revoked by the Society. The bearer of this certificate is entitled to all
        privileges and responsibilities associated with the{" "}
        <strong style={{ fontWeight: 800 }}>{props.membershipType}</strong>.
      </Field>

      <span style={{ position: "absolute", opacity: 0, pointerEvents: "none", fontSize: 1 }}>
        {CHAIRMAN_NAME} {CHAIRMAN_TITLE}
      </span>
    </div>
  );
}
