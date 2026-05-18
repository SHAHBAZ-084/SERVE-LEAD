import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
export { logo, sealImg };

// ─── Verified Stamp (pure SVG, no image needed) ───────────────────────────────
export const VerifiedStamp = ({ color = "#002b49", id }) => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    style={{ display: "block", transform: "rotate(-8deg)" }}
  >
    <circle cx="60" cy="60" r="53" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.85" />
    <circle cx="60" cy="60" r="49" fill="none" stroke={color} strokeWidth="1"  strokeDasharray="3 2" strokeOpacity="0.7" />
    <circle cx="60" cy="60" r="37" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.8" />
    <rect x="15" y="47" width="90" height="26" fill="#ffffff" stroke={color} strokeWidth="1.8" rx="2.5" />
    <text x="60" y="65" fontFamily="'Inter','Helvetica',sans-serif" fontSize="13" fontWeight="900" fill={color} textAnchor="middle" letterSpacing="1">VERIFIED</text>
    <text x="60" y="43" fontFamily="'Inter','Helvetica',sans-serif" fontSize="7"  fill={color} textAnchor="middle" letterSpacing="3">★★★</text>
    <text x="60" y="80" fontFamily="'Inter','Helvetica',sans-serif" fontSize="7"  fill={color} textAnchor="middle" letterSpacing="3">★★★</text>
    <path id={`top-${id}`} d="M 23 60 A 37 37 0 0 1 97 60" fill="none" />
    <path id={`bot-${id}`} d="M 97 60 A 37 37 0 0 1 23 60" fill="none" />
    <text fontSize="7.5" fontWeight="950" fontFamily="'Inter','Helvetica',sans-serif" fill={color} letterSpacing="1.2">
      <textPath href={`#top-${id}`} startOffset="50%" textAnchor="middle">SERVE &amp; LEAD</textPath>
    </text>
    <text fontSize="7.5" fontWeight="950" fontFamily="'Inter','Helvetica',sans-serif" fill={color} letterSpacing="1.2">
      <textPath href={`#bot-${id}`} startOffset="50%" textAnchor="middle">SOCIETY</textPath>
    </text>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1  →  Image 1
// Blue diagonal side panels (cyan upper + navy lower) on LEFT & RIGHT edges.
// Logo top-right.  Title "Certificate" large serif centred.  Chairman SLS.
// ═══════════════════════════════════════════════════════════════════════════════
export const Template1 = ({ data, certAssets, id }) => {
  const eventDate = data.eventId?.date
    ? new Date(data.eventId.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "28 February 2026";

  const raw = data.chairmanName || "M Farooq Ahmad";
  const chairName = raw.toLowerCase().includes("chairman") || raw.toLowerCase().includes("ceo") ? "M Farooq Ahmad" : raw;

  return (
    <div
      id={id}
      style={{
        position: "relative", width: "1123px", height: "794px",
        backgroundColor: "#ffffff", overflow: "hidden", boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── LEFT blue diagonal panel ── */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        width="195" height="794" viewBox="0 0 195 794"
      >
        {/* sky-blue upper */}
        <polygon points="0,0 195,0 148,440 0,440" fill="#29ABE2" />
        {/* dark-navy lower */}
        <polygon points="0,395 148,440 92,794 0,794" fill="#1a3a8f" />
      </svg>

      {/* ── RIGHT blue diagonal panel (mirror) ── */}
      <svg
        style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none" }}
        width="195" height="794" viewBox="0 0 195 794"
      >
        {/* sky-blue upper */}
        <polygon points="0,0 195,0 195,440 47,440" fill="#29ABE2" />
        {/* dark-navy lower */}
        <polygon points="47,395 195,395 195,794 103,794" fill="#1a3a8f" />
      </svg>

      {/* ── LOGO  top-right (inside white area, left of right panel) ── */}
      <div style={{ position: "absolute", top: "28px", right: "212px" }}>
        <img
          src={certAssets?.logo || logo}
          alt="SLS Logo"
          style={{ height: "78px", objectFit: "contain" }}
        />
      </div>

      {/* ── MAIN CONTENT centred between the two panels ── */}
      <div
        style={{
          position: "absolute", top: "58px",
          left: "212px", right: "212px",
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: "68px", fontWeight: "900", color: "#0f172a",
            margin: 0, lineHeight: 1,
            fontFamily: 'Georgia,"Times New Roman",serif',
          }}
        >
          Certificate
        </h1>

        {/* Sub-title */}
        <p
          style={{
            fontSize: "22px", color: "#0f172a",
            margin: "6px 0 0", fontWeight: "600", letterSpacing: "0.01em",
          }}
        >
          {data.awardType || "of Participation"}
        </p>

        {/* Presented to */}
        <p style={{ fontSize: "13px", fontStyle: "italic", color: "#475569", margin: "18px 0 0", letterSpacing: "0.03em" }}>
          presented to :
        </p>

        {/* Recipient name */}
        <h2
          style={{
            fontSize: "36px", fontWeight: "bold", color: "#0f172a",
            fontFamily: '"Playfair Display",Georgia,serif',
            margin: "16px 0 0", minHeight: "50px",
          }}
        >
          {data.memberId?.name || data.memberName || ""}
        </h2>

        {/* Body text */}
        <div
          style={{
            fontSize: "12.5px", lineHeight: 1.9, color: "#475569",
            fontStyle: "italic", width: "100%",
            marginTop: "16px", padding: "0 8px", boxSizing: "border-box",
          }}
        >
          {data.description ? (
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.description}</p>
          ) : (
            <>
              <p style={{ margin: 0 }}>has successfully participated in the online training session titled</p>
              <p style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold", color: "#003366", fontStyle: "italic" }}>
                &ldquo;{data.eventId?.title || "Orientation & How to Add References in MS Word"}&rdquo;
              </p>
              <p style={{ margin: 0 }}>held on {eventDate}.</p>
              <p style={{ margin: "7px 0 0", fontSize: "11.5px" }}>
                The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&amp;A session.
              </p>
              <p style={{ margin: "5px 0", fontSize: "11.5px", fontStyle: "normal" }}>
                This certificate is issued only after the <strong>successful submission</strong> of the required <strong>assessment</strong>.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>
                We appreciate the participant&apos;s commitment to academic excellence and continuous learning.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: signature | stamp | blank date line ── */}
      <div
        style={{
          position: "absolute", bottom: "54px",
          left: "212px", right: "212px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}
      >
        {/* Signature block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ height: "62px", display: "flex", alignItems: "flex-end", marginBottom: "5px" }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: "54px", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "22px", fontFamily: '"Dancing Script",cursive', color: "#0f172a" }}>
                {chairName}
              </span>
            )}
          </div>
          <div style={{ width: "165px", height: "1px", backgroundColor: "#0f172a", marginBottom: "5px" }} />
          <p style={{ fontWeight: "bold", fontSize: "13px", color: "#0f172a", margin: 0 }}>{chairName}</p>
          <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0, fontStyle: "italic" }}>Chairman SLS</p>
        </div>

        {/* Verified stamp */}
        <VerifiedStamp color="#002b49" id="t1" />

        {/* Blank second-signatory line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ height: "62px" }} />
          <div style={{ width: "155px", height: "1px", backgroundColor: "#0f172a" }} />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute", bottom: "20px", left: "212px",
          fontSize: "10px", color: "#64748b", fontStyle: "italic", fontWeight: "bold",
        }}
      >
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2  →  Image 3
// Blue hexagon wireframe clusters at TOP-RIGHT and BOTTOM-LEFT corners.
// Logo top-left.  "Date of Issue" top-left.  Title "CERTIFICATE" dark navy.
// CEO of Society.
// ═══════════════════════════════════════════════════════════════════════════════
export const Template2 = ({ data, certAssets, id }) => {
  const issueDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "1 March 2026";
  const eventDate = data.eventId?.date
    ? new Date(data.eventId.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "28 February 2026";

  const raw = data.chairmanName || "M Farooq Ahmad";
  const chairName = raw.toLowerCase().includes("chairman") || raw.toLowerCase().includes("ceo") ? "M Farooq Ahmad" : raw;

  // flat-top hexagon point-string helper
  const hx = (cx, cy, r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

  return (
    <div
      id={id}
      style={{
        position: "relative", width: "1123px", height: "794px",
        backgroundColor: "#ffffff", overflow: "hidden", boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── TOP-RIGHT hexagon cluster ── */}
      <svg
        style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none", overflow: "visible" }}
        width="310" height="265" viewBox="0 0 310 265"
      >
        {/* Solid dark corner block */}
        <rect x="195" y="0" width="115" height="115" fill="#1a3a8f" opacity="0.92" />
        {/* Filled hexagons (layered depth) */}
        <polygon points={hx(270, 52, 70)} fill="#1a3a8f" stroke="#60a5fa" strokeWidth="1" />
        <polygon points={hx(188, 118, 54)} fill="#1e40af" stroke="#38bdf8" strokeWidth="1.2" />
        <polygon points={hx(292, 172, 48)} fill="#1e40af" stroke="#38bdf8" strokeWidth="1" opacity="0.85" />
        {/* Outline-only hexagons */}
        <polygon points={hx(158, 50, 46)} fill="none" stroke="#0ea5e9" strokeWidth="1.6" />
        <polygon points={hx(242, 220, 40)} fill="none" stroke="#3b82f6" strokeWidth="1.3" />
        <polygon points={hx(120, 158, 43)} fill="none" stroke="#93c5fd" strokeWidth="1.4" />
        <polygon points={hx(310, 88, 58)} fill="none" stroke="#60a5fa" strokeWidth="1.1" opacity="0.75" />
        <polygon points={hx(95,  95, 30)} fill="none" stroke="#bfdbfe" strokeWidth="1"   opacity="0.65" />
        <polygon points={hx(200, 240, 32)} fill="none" stroke="#93c5fd" strokeWidth="1"   opacity="0.6" />
      </svg>

      {/* ── BOTTOM-LEFT hexagon cluster ── */}
      <svg
        style={{ position: "absolute", bottom: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
        width="310" height="265" viewBox="0 0 310 265"
      >
        {/* Solid dark corner block */}
        <rect x="0" y="150" width="115" height="115" fill="#1a3a8f" opacity="0.92" />
        {/* Filled hexagons */}
        <polygon points={hx(40,  213, 70)} fill="#1a3a8f" stroke="#60a5fa" strokeWidth="1" />
        <polygon points={hx(122, 147, 54)} fill="#1e40af" stroke="#38bdf8" strokeWidth="1.2" />
        <polygon points={hx(18,  93,  48)} fill="#1e40af" stroke="#38bdf8" strokeWidth="1"  opacity="0.85" />
        {/* Outline-only hexagons */}
        <polygon points={hx(152, 215, 46)} fill="none" stroke="#0ea5e9" strokeWidth="1.6" />
        <polygon points={hx(68,  45,  40)} fill="none" stroke="#3b82f6" strokeWidth="1.3" />
        <polygon points={hx(190, 125, 43)} fill="none" stroke="#93c5fd" strokeWidth="1.4" />
        <polygon points={hx(0,  175,  58)} fill="none" stroke="#60a5fa" strokeWidth="1.1" opacity="0.75" />
        <polygon points={hx(215, 100, 30)} fill="none" stroke="#bfdbfe" strokeWidth="1"   opacity="0.65" />
        <polygon points={hx(110, 240, 32)} fill="none" stroke="#93c5fd" strokeWidth="1"   opacity="0.6" />
      </svg>

      {/* ── LOGO  top-left ── */}
      <div style={{ position: "absolute", top: "30px", left: "36px" }}>
        <img
          src={certAssets?.logo || logo}
          alt="SLS Logo"
          style={{ height: "76px", objectFit: "contain" }}
        />
      </div>

      {/* Date of Issue */}
      <div style={{ position: "absolute", top: "122px", left: "42px", fontSize: "12px", color: "#475569" }}>
        Date of Issue: {issueDate}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          position: "absolute", top: "152px", left: 0, right: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
          padding: "0 80px", boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "52px", fontWeight: "900", color: "#003366",
            letterSpacing: "0.05em", textTransform: "uppercase",
            lineHeight: 1, margin: 0,
          }}
        >
          CERTIFICATE
        </h1>
        <p
          style={{
            fontSize: "23px", color: "#003366",
            margin: "9px 0 0", fontStyle: "italic", fontWeight: "bold",
          }}
        >
          {data.awardType || "Of Participation"}
        </p>
        <p style={{ fontSize: "13px", fontStyle: "italic", color: "#64748b", marginTop: "14px", letterSpacing: "0.04em" }}>
          This certificate is presented to
        </p>

        {/* Recipient name */}
        <h2
          style={{
            fontSize: "38px", fontWeight: "bold", color: "#0f172a",
            fontFamily: '"Playfair Display",Georgia,serif',
            margin: "20px 0 5px", minHeight: "50px",
          }}
        >
          {data.memberId?.name || data.memberName || ""}
        </h2>

        {/* Body */}
        <div
          style={{
            fontSize: "12.5px", lineHeight: 1.85, color: "#475569",
            fontStyle: "italic", width: "840px", marginTop: "12px",
          }}
        >
          {data.description ? (
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.description}</p>
          ) : (
            <>
              <p style={{ margin: 0 }}>has successfully participated in the online training session titled</p>
              <p style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold", color: "#003366", fontStyle: "italic" }}>
                &ldquo;{data.eventId?.title || "Orientation & How to Add References in MS Word"}&rdquo;
              </p>
              <p style={{ margin: 0 }}>held on {eventDate}.</p>
              <p style={{ margin: "7px 0 0", fontSize: "11.5px" }}>
                The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&amp;A session.
              </p>
              <p style={{ margin: "5px 0", fontSize: "11.5px", fontStyle: "normal" }}>
                This certificate is issued only after the <strong>successful submission</strong> of the required <strong>assessment</strong>.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>
                We appreciate the participant&apos;s commitment to academic excellence and continuous learning.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: signature + stamp ── */}
      <div
        style={{
          position: "absolute", bottom: "54px",
          left: "295px", right: "295px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ height: "64px", display: "flex", alignItems: "flex-end", marginBottom: "5px" }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: "56px", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "22px", fontFamily: '"Dancing Script",cursive', color: "#0f172a" }}>
                {chairName}
              </span>
            )}
          </div>
          <div style={{ width: "168px", height: "1px", backgroundColor: "#0f172a", marginBottom: "5px" }} />
          <p style={{ fontWeight: "bold", fontSize: "13px", color: "#0f172a", margin: 0 }}>{chairName}</p>
          <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0, fontStyle: "italic" }}>CEO of Society</p>
        </div>

        <VerifiedStamp color="#002b49" id="t2" />
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute", bottom: "20px", left: 0, right: 0,
          textAlign: "center", fontSize: "10.5px", color: "#64748b",
          fontStyle: "italic", fontWeight: "bold",
        }}
      >
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3  →  Image 2
// Right decorative panel: green dot grid, gold stripe, dark-navy chevron, cyan
// ribbons, blue footer bar "SERVE & LEAD SOCIETY".
// Logo top-left.  Title "CERTIFICATE OF PARTICIPATION".  Chairman SLS.
// ═══════════════════════════════════════════════════════════════════════════════
export const Template3 = ({ data, certAssets, id }) => {
  const eventDate = data.eventId?.date
    ? new Date(data.eventId.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "28 February 2026";

  const raw = data.chairmanName || "Muhammad Farooq Ahmad";
  const chairName = raw.toLowerCase().includes("chairman") || raw.toLowerCase().includes("ceo") ? "Muhammad Farooq Ahmad" : raw;

  // Build green dot grid coordinates
  const dotRows1 = [20, 40, 60, 80, 100];
  const dotCols1 = [258, 278, 298, 318, 338, 358];
  const dotRows2 = [30, 50, 70, 90];
  const dotCols2 = [248, 268, 288, 308, 328, 348];

  return (
    <div
      id={id}
      style={{
        position: "relative", width: "1123px", height: "794px",
        backgroundColor: "#ffffff", overflow: "hidden", boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── Subtle left-area geometric watermark ── */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0.04 }}
        width="700" height="794" viewBox="0 0 700 794"
      >
        <polygon points="0,0 200,0 100,150 0,100"          fill="#94a3b8" />
        <polygon points="100,150 300,120 200,280"           fill="#94a3b8" />
        <polygon points="0,100 100,150 0,300"               fill="#64748b" />
        <polygon points="0,300 200,280 150,480 0,420"       fill="#94a3b8" />
        <polygon points="200,280 300,120 400,250 350,420"   fill="#64748b" />
        <polygon points="0,420 150,480 0,600"               fill="#64748b" />
        <polygon points="0,600 280,620 200,794 0,794"       fill="#94a3b8" />
        <polygon points="280,620 480,500 520,680 400,794"   fill="#94a3b8" />
      </svg>

      {/* ── RIGHT DECORATIVE PANEL ── */}
      <svg
        style={{ position: "absolute", top: 0, right: 0, pointerEvents: "none" }}
        width="380" height="794" viewBox="0 0 380 794"
      >
        {/* Green dot grid – two offset rows */}
        <g opacity="0.72">
          {dotRows1.flatMap(y =>
            dotCols1.map(x => (
              <circle key={`d1-${x}-${y}`} cx={x - 743} cy={y} r="2.8" fill="#10b981" />
            ))
          )}
          {dotRows2.flatMap(y =>
            dotCols2.map(x => (
              <circle key={`d2-${x}-${y}`} cx={x - 743} cy={y} r="2.8" fill="#10b981" />
            ))
          )}
        </g>

        {/* Top cyan ribbon */}
        <polygon points="380,0 220,0 50,170 380,500"    fill="#00a8ff" />
        {/* Top gold diagonal stripe */}
        <line x1="220" y1="0"   x2="50"  y2="170" stroke="#c8a951" strokeWidth="9" />
        {/* Top parallel dark-green line */}
        <line x1="180" y1="0"   x2="10"  y2="170" stroke="#0c3d25" strokeWidth="2.5" />

        {/* Bottom cyan ribbon */}
        <polygon points="380,340 50,624 220,794 380,794" fill="#00a8ff" />
        {/* Bottom gold diagonal stripe */}
        <line x1="50"  y1="624" x2="220" y2="794" stroke="#c8a951" strokeWidth="9" />
        {/* Bottom parallel dark-green line */}
        <line x1="10"  y1="624" x2="180" y2="794" stroke="#0c3d25" strokeWidth="2.5" />

        {/* Deep-navy front chevron pointing left */}
        <polygon points="380,140 100,420 380,700"         fill="#0c213d" />
        {/* White accent dot in chevron */}
        <circle cx="260" cy="420" r="7.5" fill="#ffffff" />

        {/* Gold corner fold bottom-right */}
        <polygon points="380,720 306,794 380,794"          fill="#c8a951" />
        {/* Blue footer bar */}
        <rect x="145" y="744" width="235" height="50"      fill="#00a8ff" />
      </svg>

      {/* "SERVE & LEAD SOCIETY" text on blue footer bar */}
      <div
        style={{
          position: "absolute", bottom: 0, right: 0,
          width: "235px", height: "50px",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10, pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "10.5px", fontWeight: "bold", color: "#ffffff",
            letterSpacing: "0.09em",
          }}
        >
          SERVE &amp; LEAD SOCIETY
        </span>
      </div>

      {/* ── LOGO  top-left ── */}
      <div style={{ position: "absolute", top: "30px", left: "44px" }}>
        <img
          src={certAssets?.logo || logo}
          alt="SLS Logo"
          style={{ height: "76px", objectFit: "contain" }}
        />
      </div>

      {/* ── TITLE ── */}
      <div style={{ position: "absolute", top: "128px", left: 0, width: "743px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "43px", fontWeight: "900", color: "#0f172a",
            textTransform: "uppercase", letterSpacing: "0.02em",
            lineHeight: 1.1, margin: 0,
          }}
        >
          CERTIFICATE OF PARTICIPATION
        </h1>
        <p
          style={{
            fontSize: "15px", color: "#475569", marginTop: "14px",
            fontWeight: "bold", letterSpacing: "0.05em",
          }}
        >
          This Certificate Is Proudly Presented To
        </p>
      </div>

      {/* ── RECIPIENT NAME + underline ── */}
      <div
        style={{
          position: "absolute", top: "254px", left: 0, width: "743px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: "36px", fontWeight: "bold", color: "#0f172a",
            fontFamily: '"Playfair Display",Georgia,serif',
            margin: "0 0 10px 0",
          }}
        >
          {data.memberId?.name || data.memberName || ""}
        </h2>
        <div style={{ width: "460px", height: "1.2px", backgroundColor: "#0f172a" }} />
      </div>

      {/* ── BODY TEXT ── */}
      <div
        style={{
          position: "absolute", top: "352px", left: 0, width: "743px",
          padding: "0 80px", boxSizing: "border-box",
          textAlign: "center", fontSize: "13px", lineHeight: 1.8,
          color: "#475569", fontStyle: "italic",
        }}
      >
        {data.description ? (
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.description}</p>
        ) : (
          <>
            <p style={{ margin: 0 }}>In recognition of active participation in the</p>
            <p style={{ margin: "5px 0", fontSize: "14.5px", fontWeight: "bold", color: "#002b49", fontStyle: "normal" }}>
              {data.eventId?.title || "Linkedin Profile Development Session"}
            </p>
            <p style={{ margin: "6px 0 0" }}>
              Your dedication to personal branding &amp; professional growth is truly appreciated.
              We commend your commitment to enhancing your digital presence &amp; career development.
            </p>
          </>
        )}
      </div>

      {/* ── BOTTOM: signature + blank date line ── */}
      <div
        style={{
          position: "absolute", bottom: "62px", left: "44px", width: "643px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}
      >
        {/* Signature block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "220px" }}>
          <div style={{ height: "66px", display: "flex", alignItems: "flex-end", marginBottom: "5px" }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: "58px", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "22px", fontFamily: '"Dancing Script",cursive', color: "#0f172a" }}>
                {chairName}
              </span>
            )}
          </div>
          <div style={{ width: "200px", height: "1.2px", backgroundColor: "#0f172a", marginBottom: "5px" }} />
          <p style={{ fontWeight: "bold", fontSize: "13.5px", color: "#0f172a", margin: 0 }}>{chairName}</p>
          <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0, fontStyle: "italic" }}>Chairman SLS</p>
        </div>

        {/* Blank second line (date / co-signatory) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "180px" }}>
          <div style={{ height: "66px" }} />
          <div style={{ width: "160px", height: "1.2px", backgroundColor: "#0f172a" }} />
        </div>
      </div>

      {/* ── VERIFIED STAMP overlaid on the navy chevron ── */}
      <div style={{ position: "absolute", bottom: "78px", right: "138px", zIndex: 10 }}>
        <VerifiedStamp color="#002b49" id="t3" />
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute", bottom: "22px", left: "44px",
          fontSize: "9.5px", color: "#64748b", fontStyle: "italic", fontWeight: "bold",
        }}
      >
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};
