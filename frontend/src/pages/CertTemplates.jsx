import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
export { logo, sealImg };

// High-Fidelity Circular Verified Stamp (Pure Vector SVG for crisp rendering & instant loading)
export const VerifiedStamp = ({ color = "#002b49", id }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block', transform: 'rotate(-8deg)' }}>
    {/* Stamp outer rings */}
    <circle cx="60" cy="60" r="53" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.85" />
    <circle cx="60" cy="60" r="49" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.7" />
    <circle cx="60" cy="60" r="37" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.8" />
    
    {/* Center VERIFIED Banner */}
    <rect x="15" y="47" width="90" height="26" fill="#ffffff" stroke={color} strokeWidth="1.8" rx="2.5" />
    <text x="60" y="65" fontFamily="'Inter', 'Helvetica', sans-serif" fontSize="13" fontWeight="900" fill={color} textAnchor="middle" letterSpacing="1">
      VERIFIED
    </text>
    
    {/* Stars */}
    <text x="60" y="43" fontFamily="'Inter', 'Helvetica', sans-serif" fontSize="7" fill={color} textAnchor="middle" letterSpacing="3">
      ★★★
    </text>
    <text x="60" y="80" fontFamily="'Inter', 'Helvetica', sans-serif" fontSize="7" fill={color} textAnchor="middle" letterSpacing="3">
      ★★★
    </text>

    {/* Text Paths */}
    <path id={`stamp-top-${id}`} d="M 23 60 A 37 37 0 0 1 97 60" fill="none" />
    <path id={`stamp-bottom-${id}`} d="M 97 60 A 37 37 0 0 1 23 60" fill="none" />
    
    <text fontSize="7.5" fontWeight="950" fontFamily="'Inter', 'Helvetica', sans-serif" fill={color} letterSpacing="1.2">
      <textPath href={`#stamp-top-${id}`} startOffset="50%" textAnchor="middle">
        SERVE & LEAD
      </textPath>
    </text>
    <text fontSize="7.5" fontWeight="950" fontFamily="'Inter', 'Helvetica', sans-serif" fill={color} letterSpacing="1.2">
      <textPath href={`#stamp-bottom-${id}`} startOffset="50%" textAnchor="middle">
        SOCIETY
      </textPath>
    </text>
  </svg>
);

// Template 1 (Portrait - First Image)
export const Template1 = ({ data, certAssets, id }) => {
  const issueDate = data.createdAt 
    ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '1 March 2026';

  const eventDate = data.eventId?.date 
    ? new Date(data.eventId.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '28 February 2026';

  // Handle double 'Chairman SLS' text fallback
  const chairmanName = data.chairmanName || "M Farooq Ahmad";
  const finalChairmanName = (chairmanName.toLowerCase().includes("chairman") || chairmanName.toLowerCase().includes("ceo")) 
    ? "M Farooq Ahmad" 
    : chairmanName;

  return (
    <div id={id} style={{
      position: 'relative', width: '794px', height: '1123px',
      backgroundColor: '#ffffff', fontFamily: '"Playfair Display", serif',
      overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
    }}>
      {/* Top-Right Premium Dense Triangulation Geometric Mesh (SVG) */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '340px', height: '340px', pointerEvents: 'none' }}>
        <svg width="340" height="340" viewBox="0 0 340 340" style={{ display: 'block' }}>
          <polygon points="340,0 280,0 310,50" fill="#003366" />
          <polygon points="280,0 220,0 250,50" fill="#1a8cff" opacity="0.9" />
          <polygon points="220,0 160,0 190,50" fill="#66b3ff" opacity="0.6" />
          <polygon points="310,50 250,50 280,110" fill="#005082" />
          <polygon points="250,50 190,50 220,110" fill="#1a8cff" opacity="0.85" />
          <polygon points="190,50 130,50 160,110" fill="#002b49" opacity="0.15" />
          <polygon points="340,0 310,50 340,70" fill="#007acc" />
          <polygon points="340,70 280,110 340,140" fill="#00a2e8" />
          <polygon points="280,110 220,110 250,180" fill="#005082" />
          <polygon points="220,110 160,110 190,180" fill="#1a8cff" opacity="0.75" />
          <polygon points="340,140 250,180 300,240" fill="#002b49" />
          <polygon points="250,180 190,180 210,250" fill="#3399ff" opacity="0.5" />
          <polygon points="340,140 300,240 340,260" fill="#1a8cff" opacity="0.4" />
          <polygon points="300,240 210,250 260,310" fill="#005082" />
          <polygon points="340,260 260,310 340,330" fill="#3399ff" opacity="0.3" />
        </svg>
      </div>

      {/* Bottom-Left Premium Dense Triangulation Geometric Mesh (SVG) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '340px', height: '340px', pointerEvents: 'none' }}>
        <svg width="340" height="340" viewBox="0 0 340 340" style={{ display: 'block' }}>
          <polygon points="0,340 60,340 30,290" fill="#003366" />
          <polygon points="60,340 120,340 90,290" fill="#1a8cff" opacity="0.9" />
          <polygon points="120,340 180,340 150,290" fill="#66b3ff" opacity="0.6" />
          <polygon points="30,290 90,290 60,230" fill="#005082" />
          <polygon points="90,290 150,290 120,230" fill="#1a8cff" opacity="0.85" />
          <polygon points="150,290 210,290 180,230" fill="#002b49" opacity="0.15" />
          <polygon points="0,340 30,290 0,270" fill="#007acc" />
          <polygon points="0,270 60,230 0,200" fill="#00a2e8" />
          <polygon points="60,230 120,230 90,160" fill="#005082" />
          <polygon points="120,230 180,230 150,160" fill="#1a8cff" opacity="0.75" />
          <polygon points="0,200 90,160 40,100" fill="#002b49" />
          <polygon points="90,160 150,160 130,90" fill="#3399ff" opacity="0.5" />
          <polygon points="0,200 40,100 0,80" fill="#1a8cff" opacity="0.4" />
          <polygon points="40,100 130,90 80,30" fill="#005082" />
          <polygon points="0,80 80,30 0,10" fill="#3399ff" opacity="0.3" />
        </svg>
      </div>

      {/* Double Border Frame */}
      <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '1.5px solid #002b49', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '0.8px solid #002b49', pointerEvents: 'none' }} />

      {/* Logo Top-Left */}
      <div style={{ position: 'absolute', top: '45px', left: '45px' }}>
        <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '70px', objectFit: 'contain' }} />
      </div>

      {/* Date of Issue below logo (Clean non-bold style matching mockup) */}
      <div style={{ position: 'absolute', top: '135px', left: '45px', fontSize: '11.5px', color: '#475569', fontFamily: 'sans-serif' }}>
        Date of Issue: {issueDate}
      </div>

      {/* Centered Main Title Content */}
      <div style={{ paddingTop: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: '58px', fontWeight: '900', color: '#003366', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, margin: 0 }}>
          CERTIFICATE
        </h1>
        <p style={{ fontSize: '26px', color: '#003366', margin: '6px 0 0', fontStyle: 'italic', fontWeight: 'bold' }}>
          {data.awardType || "Of Participation"}
        </p>
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', marginTop: '15px', letterSpacing: '0.05em' }}>
          This certificate is presented to
        </p>
      </div>

      {/* Recipient Name (Centered with clear underline frame) */}
      <div style={{ textAlign: 'center', marginTop: '35px', padding: '0 60px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Playfair Display", serif', textTransform: 'none', borderBottom: '1.2px solid #002b49', display: 'inline-block', paddingBottom: '8px', minWidth: '460px' }}>
          {data.memberId?.name || data.memberName || "Member Name"}
        </h2>
      </div>

      {/* Body Text Blocks */}
      <div style={{ textAlign: 'center', marginTop: '35px', padding: '0 85px', fontFamily: 'sans-serif', fontSize: '12.5px', lineHeight: 1.8, color: '#475569', fontStyle: 'italic' }}>
        {data.description ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.description}</p>
        ) : (
          <div>
            <p style={{ margin: 0 }}>
              has successfully participated in the online training session titled
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold', color: '#003366', fontStyle: 'normal' }}>
              “{data.eventId?.title || "Orientation & How to Add References in MS Word"}”
            </p>
            <p style={{ margin: 0 }}>
              held on {eventDate}.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#64748b' }}>
              The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session.
            </p>
            <p style={{ margin: '4px 0', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', fontStyle: 'normal' }}>
              This certificate is issued only after the successful submission of the required assessment.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#64748b' }}>
              We appreciate the participant's commitment to academic excellence and continuous learning.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Footer Section: CEO Signature & Verified Stamp */}
      <div style={{ position: 'absolute', bottom: '85px', left: '85px', right: '85px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* CEO Signature Block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '5px' }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: '60px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '26px', fontFamily: '"Dancing Script", cursive', color: '#0f172a' }}>
                {finalChairmanName}
              </span>
            )}
          </div>
          <div style={{ width: '170px', height: '1px', backgroundColor: '#0f172a', marginBottom: '5px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', margin: 0 }}>
            {finalChairmanName}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            CEO of Society
          </p>
        </div>

        {/* Dynamic Vector Verified Stamp (Black as Mockup) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <VerifiedStamp color="#002b49" id="t1" />
        </div>
      </div>

      {/* Footer Text */}
      <div style={{ position: 'absolute', bottom: 35, left: 0, width: '100%', textAlign: 'center', fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '0.02em' }}>
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};

// Template 2 (Landscape - Third Image)
export const Template2 = ({ data, certAssets, id }) => {
  const eventDate = data.eventId?.date 
    ? new Date(data.eventId.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '28 February 2026';

  // Handle double 'Chairman SLS' text fallback
  const chairmanName = data.chairmanName || "M Farooq Ahmad";
  const finalChairmanName = (chairmanName.toLowerCase().includes("chairman") || chairmanName.toLowerCase().includes("ceo")) 
    ? "M Farooq Ahmad" 
    : chairmanName;

  return (
    <div id={id} style={{
      position: 'relative', width: '1123px', height: '794px',
      backgroundColor: '#ffffff', fontFamily: 'sans-serif',
      overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
    }}>
      {/* Top-Left/Left-Edge Modern Geometric Polygon Accents (SVG) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '420px', height: '100%', pointerEvents: 'none' }}>
        <svg width="420" height="794" viewBox="0 0 420 794" style={{ display: 'block' }}>
          {/* Top-left dark blue polygon */}
          <polygon points="0,0 260,0 120,160 0,100" fill="#003366" />
          {/* Top-left bright cyan diagonal stripe */}
          <polygon points="0,0 200,0 80,130 0,80" fill="#00a8ff" opacity="0.85" />
          {/* Left abstract geometric fold overlay */}
          <polygon points="0,150 70,200 50,380 0,320" fill="#0c213d" opacity="0.08" />
          {/* Bottom-left geometric block */}
          <polygon points="0,580 140,670 90,794 0,794" fill="#003366" />
          <polygon points="0,640 100,700 60,794 0,794" fill="#00a8ff" opacity="0.85" />
        </svg>
      </div>

      {/* Right-Edge Premium Diagonal Polygon Fold Overlay (SVG) */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', pointerEvents: 'none' }}>
        <svg width="450" height="794" viewBox="0 0 450 794" style={{ display: 'block' }}>
          {/* Bright blue back fold */}
          <polygon points="450,0 210,0 355,397 210,794 450,794" fill="#00a8ff" />
          {/* Deep Navy front block */}
          <polygon points="450,0 240,0 375,397 240,794 450,794" fill="#002b49" />
          {/* Decorative neon green stripe overlay */}
          <polyline points="240,0 375,397 240,794" fill="none" stroke="#22c55e" strokeWidth="4" />
        </svg>
      </div>

      {/* Logo Top-Right */}
      <div style={{ position: 'absolute', top: '35px', right: '45px', display: 'flex', alignItems: 'center' }}>
        <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '65px', objectFit: 'contain' }} />
      </div>

      {/* Title & Header Section Centered in the left white panel */}
      <div style={{ position: 'absolute', top: '60px', left: '100px', width: '570px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '46px', fontWeight: '900', color: '#002b49', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1, margin: 0 }}>
          Certificate
        </h1>
        <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#00a8ff', margin: '4px 0 0', fontStyle: 'italic' }}>
          of Participation
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
          presented to :
        </p>
      </div>

      {/* Recipient Name Panel (Centered inside left white panel) */}
      <div style={{ position: 'absolute', top: '230px', left: '100px', width: '570px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Playfair Display", serif', margin: 0, textTransform: 'none', borderBottom: '1.5px solid #002b49', display: 'inline-block', paddingBottom: '6px', minWidth: '400px' }}>
          {data.memberId?.name || data.memberName || "Member Name"}
        </h2>
      </div>

      {/* Body Content (Centered inside left white panel) */}
      <div style={{ position: 'absolute', top: '330px', left: '100px', width: '570px', textAlign: 'center', fontSize: '12.5px', lineHeight: 1.8, color: '#475569', fontStyle: 'italic' }}>
        {data.description ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.description}</p>
        ) : (
          <div>
            <p style={{ margin: 0 }}>
              has successfully participated in the online training session titled
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold', color: '#002b49', fontStyle: 'normal' }}>
              “{data.eventId?.title || "Orientation & How to Add References in MS Word"}”
            </p>
            <p style={{ margin: 0 }}>
              held on {eventDate}.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#64748b' }}>
              The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session.
            </p>
            <p style={{ margin: '4px 0', fontSize: '11.5px', fontWeight: 'bold', color: '#0f172a', fontStyle: 'normal' }}>
              This certificate is issued only after the successful submission of the required assessment.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Footer Section (Perfectly aligned with centered design) */}
      <div style={{ position: 'absolute', bottom: '65px', left: '100px', width: '570px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ height: '65px', display: 'flex', alignItems: 'flex-end', marginBottom: '4px' }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: '55px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '24px', fontFamily: '"Dancing Script", cursive', color: '#0f172a' }}>
                {finalChairmanName}
              </span>
            )}
          </div>
          <div style={{ width: '160px', height: '1.2px', backgroundColor: '#0f172a', marginBottom: '4px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', margin: 0 }}>
            {finalChairmanName}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Chairman SLS
          </p>
        </div>

        {/* Dynamic Vector Verified Stamp (Black as Mockup) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <VerifiedStamp color="#002b49" id="t2" />
        </div>

        {/* Date Line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', paddingBottom: '10px' }}>
            {eventDate}
          </span>
          <div style={{ width: '100%', height: '1px', backgroundColor: '#94a3b8', marginBottom: '22px' }} />
        </div>
      </div>

      {/* Footer Text */}
      <div style={{ position: 'absolute', bottom: '25px', left: '100px', width: '570px', textAlign: 'center', fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', fontWeight: 'bold' }}>
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};

// Template 3 (Landscape - Second Image)
export const Template3 = ({ data, certAssets, id }) => {
  // Handle double 'Chairman SLS' text fallback
  const chairmanName = data.chairmanName || "Muhammad Farooq Ahmad";
  const finalChairmanName = (chairmanName.toLowerCase().includes("chairman") || chairmanName.toLowerCase().includes("ceo")) 
    ? "Muhammad Farooq Ahmad" 
    : chairmanName;

  return (
    <div id={id} style={{
      position: 'relative', width: '1123px', height: '794px',
      backgroundColor: '#ffffff', fontFamily: 'sans-serif',
      overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
    }}>
      {/* Left-Side Soft Organic Geometric Polygonal Background Watermark (Subtle opacity & color for elegant paper feel) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '700px', height: '100%', pointerEvents: 'none', opacity: 0.04 }}>
        <svg width="700" height="794" viewBox="0 0 700 794" style={{ display: 'block' }}>
          <polygon points="0,0 200,0 100,150 0,100" fill="#94a3b8" />
          <polygon points="100,150 300,120 200,280" fill="#94a3b8" />
          <polygon points="0,100 100,150 0,300" fill="#64748b" />
          <polygon points="0,300 200,280 150,480 0,420" fill="#94a3b8" />
          <polygon points="200,280 300,120 400,250 350,420" fill="#64748b" />
          <polygon points="350,420 400,250 550,300 480,500" fill="#94a3b8" />
          <polygon points="150,480 350,420 280,620 100,580" fill="#94a3b8" />
          <polygon points="0,420 150,480 0,600" fill="#64748b" />
          <polygon points="0,600 280,620 200,794 0,794" fill="#94a3b8" />
          <polygon points="280,620 480,500 520,680 400,794" fill="#94a3b8" />
          <polygon points="400,794 520,680 600,794" fill="#64748b" />
        </svg>
      </div>

      {/* Decorative Gold & Blue Accent Dots (Behind right panel) */}
      <div style={{ position: 'absolute', top: '15px', right: '360px', display: 'grid', gridTemplateColumns: 'repeat(6, 8px)', gap: '6px', opacity: 0.65 }}>
        {Array(24).fill(0).map((_, i) => (
          <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#c8a951', borderRadius: '50%' }} />
        ))}
      </div>

      {/* Right-Edge Advanced Premium Diagonal Fold Overlay (SVG) */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '380px', height: '100%', pointerEvents: 'none' }}>
        <svg width="380" height="794" viewBox="0 0 380 794" style={{ display: 'block' }}>
          {/* Bright blue accent fold */}
          <polygon points="380,0 100,0 230,397 100,794 380,794" fill="#00a8ff" />
          {/* Deep Navy front fold */}
          <polygon points="380,0 130,0 250,397 130,794 380,794" fill="#0c213d" />
          {/* Darker blue inner shadow */}
          <polygon points="380,0 160,0 265,397 160,794 380,794" fill="#08162b" />
          {/* Gold diagonal border stripe */}
          <polyline points="130,0 250,397 130,794" fill="none" stroke="#c8a951" strokeWidth="8" />
        </svg>
      </div>

      {/* Logo Top-Left */}
      <div style={{ position: 'absolute', top: '35px', left: '50px' }}>
        <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '70px', objectFit: 'contain' }} />
      </div>

      {/* Title block */}
      <div style={{ position: 'absolute', top: '130px', left: '50px', width: '650px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1, margin: 0 }}>
          CERTIFICATE OF PARTICIPATION
        </h1>
        <p style={{ fontSize: '15px', color: '#475569', marginTop: '12px', fontWeight: 'bold', tracking: '0.05em' }}>
          This Certificate Is Proudly Presented To
        </p>
      </div>

      {/* Recipient Name with underline */}
      <div style={{ position: 'absolute', top: '250px', left: '50px', width: '650px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Playfair Display", serif', margin: '0 0 10px 0', textTransform: 'none' }}>
          {data.memberId?.name || data.memberName || "Member Name"}
        </h2>
        <div style={{ width: '80%', height: '1.2px', backgroundColor: '#0f172a' }} />
      </div>

      {/* Body Description */}
      <div style={{ position: 'absolute', top: '350px', left: '50px', width: '600px', fontSize: '13px', lineHeight: 1.8, color: '#475569', fontWeight: '500' }}>
        {data.description ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.description}</p>
        ) : (
          <div>
            <p style={{ margin: 0 }}>
              In recognition of active participation in the <strong style={{ color: '#002b49' }}>“{data.eventId?.title || "Linkedin Profile Development Session"}”</strong>
            </p>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>
              Your dedication to personal branding & professional growth is truly appreciated. We commend your commitment to enhancing your digital presence & career development.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Signature and Stamp Section */}
      <div style={{ position: 'absolute', bottom: '65px', left: '50px', width: '680px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ height: '65px', display: 'flex', alignItems: 'flex-end', marginBottom: '4px' }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: '55px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '24px', fontFamily: '"Dancing Script", cursive', color: '#0f172a' }}>
                {finalChairmanName}
              </span>
            )}
          </div>
          <div style={{ width: '220px', height: '1.2px', backgroundColor: '#0f172a', marginBottom: '5px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', margin: 0 }}>
            {finalChairmanName}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Chairman SLS
          </p>
        </div>

        {/* Dynamic Vector Verified Stamp (Black as Mockup) */}
        <div style={{ marginRight: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <VerifiedStamp color="#002b49" id="t3" />
        </div>
      </div>

      {/* Very Bottom Footer */}
      <div style={{ position: 'absolute', bottom: '25px', left: '50px', right: '360px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic', fontWeight: 'bold', margin: 0 }}>
          Verify Through SLS Website by Using Membership ID
        </p>
        <p style={{ fontSize: '11.5px', fontWeight: '900', color: '#002b49', margin: 0, letterSpacing: '0.05em' }}>
          SERVE & LEAD SOCIETY
        </p>
      </div>
    </div>
  );
};
