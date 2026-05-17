import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
export { logo, sealImg };

// Template 1 (Portrait - First Image)
export const Template1 = ({ data, certAssets, id }) => {
  const issueDate = data.createdAt 
    ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '1 March 2026';

  const eventDate = data.eventId?.date 
    ? new Date(data.eventId.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '28 February 2026';

  return (
    <div id={id} style={{
      position: 'relative', width: '794px', height: '1123px',
      backgroundColor: '#ffffff', fontFamily: '"Playfair Display", serif',
      overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
    }}>
      {/* Top-Right Premium 3D Tessellated Triangular Mesh (SVG) */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '320px', height: '320px', pointerEvents: 'none' }}>
        <svg width="320" height="320" viewBox="0 0 320 320" style={{ display: 'block' }}>
          <polygon points="320,0 240,0 280,60" fill="#003366" />
          <polygon points="240,0 160,0 200,60" fill="#1a8cff" opacity="0.9" />
          <polygon points="280,60 200,60 240,130" fill="#005082" />
          <polygon points="320,0 280,60 320,80" fill="#007acc" />
          <polygon points="320,80 240,130 320,170" fill="#00a2e8" />
          <polygon points="240,130 200,60 140,110" fill="#002b49" />
          <polygon points="200,60 160,0 120,70" fill="#3399ff" opacity="0.75" />
          <polygon points="140,110 120,70 70,140" fill="#1a8cff" opacity="0.6" />
          <polygon points="240,130 140,110 180,200" fill="#005082" />
          <polygon points="320,170 240,130 270,220" fill="#3399ff" opacity="0.8" />
          <polygon points="320,170 270,220 320,240" fill="#007acc" />
          <polygon points="270,220 180,200 220,290" fill="#002b49" />
          <polygon points="320,240 270,220 320,300" fill="#1a8cff" opacity="0.5" />
          <polygon points="180,200 140,110 90,200" fill="#66b3ff" opacity="0.4" />
          <polygon points="220,290 180,200 130,270" fill="#3399ff" opacity="0.3" />
        </svg>
      </div>

      {/* Bottom-Left Premium 3D Tessellated Triangular Mesh (SVG) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '320px', height: '320px', pointerEvents: 'none' }}>
        <svg width="320" height="320" viewBox="0 0 320 320" style={{ display: 'block' }}>
          <polygon points="0,320 80,320 40,260" fill="#003366" />
          <polygon points="80,320 160,320 120,260" fill="#1a8cff" opacity="0.9" />
          <polygon points="40,260 120,260 80,190" fill="#005082" />
          <polygon points="0,320 40,260 0,240" fill="#007acc" />
          <polygon points="0,240 80,190 0,150" fill="#00a2e8" />
          <polygon points="80,190 120,260 180,210" fill="#002b49" />
          <polygon points="120,260 160,320 200,250" fill="#3399ff" opacity="0.75" />
          <polygon points="180,210 200,250 250,180" fill="#1a8cff" opacity="0.6" />
          <polygon points="80,190 180,210 140,120" fill="#005082" />
          <polygon points="0,150 80,190 50,100" fill="#3399ff" opacity="0.8" />
          <polygon points="0,150 50,100 0,80" fill="#007acc" />
          <polygon points="50,100 140,120 100,30" fill="#002b49" />
          <polygon points="0,80 50,100 0,20" fill="#1a8cff" opacity="0.5" />
          <polygon points="140,120 180,210 230,120" fill="#66b3ff" opacity="0.4" />
          <polygon points="100,30 140,120 190,50" fill="#3399ff" opacity="0.3" />
        </svg>
      </div>

      {/* Double Border Frame */}
      <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '15px', right: '15px', border: '1.5px solid #002b49', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '0.8px solid #002b49', pointerEvents: 'none' }} />

      {/* Logo Top-Left */}
      <div style={{ position: 'absolute', top: '45px', left: '45px' }}>
        <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '70px', objectFit: 'contain' }} />
      </div>

      {/* Date of Issue below logo */}
      <div style={{ position: 'absolute', top: '135px', left: '45px', fontSize: '12px', color: '#334155', fontWeight: 'bold' }}>
        Date of Issue: {issueDate}
      </div>

      {/* Centered Main Title Content */}
      <div style={{ paddingTop: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#003366', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, margin: 0 }}>
          CERTIFICATE
        </h1>
        <p style={{ fontSize: '26px', color: '#003366', margin: '6px 0 0', fontStyle: 'italic', fontWeight: 'bold' }}>
          {data.awardType || "Of Participation"}
        </p>
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', marginTop: '15px', letterSpacing: '0.05em' }}>
          This certificate is presented to
        </p>
      </div>

      {/* Recipient Name */}
      <div style={{ textAlign: 'center', marginTop: '35px', padding: '0 60px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Playfair Display", serif', textTransform: 'none', borderBottom: '1px solid #cbd5e1', display: 'inline-block', paddingBottom: '5px', minWidth: '350px' }}>
          {data.memberId?.name || data.memberName || "Member Name"}
        </h2>
      </div>

      {/* Body Text Blocks */}
      <div style={{ textAlign: 'center', marginTop: '35px', padding: '0 80px', fontFamily: '"Inter", sans-serif', fontSize: '12.5px', lineHeight: 1.8, color: '#334155', fontStyle: 'italic' }}>
        {data.description ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{data.description}</p>
        ) : (
          <div style={{ spaceY: '8px' }}>
            <p style={{ margin: 0 }}>
              has successfully participated in the online training session titled
            </p>
            <p style={{ margin: '4px 0', fontSize: '14.5px', fontWeight: 'bold', color: '#003366', fontStyle: 'normal' }}>
              “{data.eventId?.title || "Orientation & How to Add References in MS Word"}”
            </p>
            <p style={{ margin: 0 }}>
              held on {eventDate}.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#475569' }}>
              The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session.
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', fontStyle: 'normal' }}>
              This certificate is issued only after the successful submission of the required assessment.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569' }}>
              We appreciate the participant's commitment to academic excellence and continuous learning.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Footer Section: CEO Signature & Verified Stamp */}
      <div style={{ position: 'absolute', bottom: '80px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* CEO Signature Block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '5px' }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: '60px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '26px', fontFamily: '"Dancing Script", cursive', color: '#0f172a' }}>
                {data.chairmanName || "M Farooq Ahmad"}
              </span>
            )}
          </div>
          <div style={{ width: '170px', height: '1px', backgroundColor: '#0f172a', marginBottom: '5px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', margin: 0 }}>
            {data.chairmanName || "M Farooq Ahmad"}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            CEO of Society
          </p>
        </div>

        {/* Verification Circular Stamp */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={certAssets?.stamp || certAssets?.seal || sealImg} 
            alt="Verified Stamp" 
            style={{ width: '115px', height: '115px', objectFit: 'contain' }} 
          />
        </div>
      </div>

      {/* Footer Text */}
      <div style={{ position: 'absolute', bottom: '35px', left: 0, width: '100%', textAlign: 'center', fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', fontWeight: 'bold', letterSpacing: '0.02em' }}>
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

  return (
    <div id={id} style={{
      position: 'relative', width: '1123px', height: '794px',
      backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif',
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

      {/* Title & Header Section Left-Aligned */}
      <div style={{ position: 'absolute', top: '50px', left: '100px', width: '550px' }}>
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

      {/* Recipient Name Panel */}
      <div style={{ position: 'absolute', top: '230px', left: '100px', width: '560px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a', fontFamily: '"Playfair Display", serif', margin: 0, textTransform: 'none', borderBottom: '1.5px solid #002b49', display: 'inline-block', paddingBottom: '6px', minWidth: '420px' }}>
          {data.memberId?.name || data.memberName || "Member Name"}
        </h2>
      </div>

      {/* Body Content */}
      <div style={{ position: 'absolute', top: 330, left: '100px', width: '560px', fontSize: '12.5px', lineHeight: 1.8, color: '#334155', fontStyle: 'italic' }}>
        {data.description ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.description}</p>
        ) : (
          <div>
            <p style={{ margin: 0 }}>
              has successfully participated in the online training session titled
            </p>
            <p style={{ margin: '4px 0', fontSize: '14.5px', fontWeight: 'bold', color: '#002b49', fontStyle: 'normal' }}>
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

      {/* Bottom Footer Section */}
      <div style={{ position: 'absolute', bottom: '65px', left: '100px', width: '560px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ height: '65px', display: 'flex', alignItems: 'flex-end', marginBottom: '4px' }}>
            {certAssets?.signature ? (
              <img src={certAssets.signature} alt="Signature" style={{ height: '55px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '24px', fontFamily: '"Dancing Script", cursive', color: '#0f172a' }}>
                {data.chairmanName || "M Farooq Ahmad"}
              </span>
            )}
          </div>
          <div style={{ width: '180px', height: '1.2px', backgroundColor: '#0f172a', marginBottom: '4px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', margin: 0 }}>
            {data.chairmanName || "M Farooq Ahmad"}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Chairman SLS
          </p>
        </div>

        {/* Verification Circular Stamp */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={certAssets?.stamp || certAssets?.seal || sealImg} 
            alt="Verified Stamp" 
            style={{ width: '110px', height: '110px', objectFit: 'contain' }} 
          />
        </div>

        {/* Date Line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', paddingBottom: '10px' }}>
            {eventDate}
          </span>
          <div style={{ width: '100%', height: '1px', backgroundColor: '#94a3b8', marginBottom: '22px' }} />
        </div>
      </div>

      {/* Footer Text */}
      <div style={{ position: 'absolute', bottom: '25px', left: '100px', fontSize: '10px', color: '#64748b', fontStyle: 'italic', fontWeight: 'bold' }}>
        Verify Through SLS Website by Using Membership ID
      </div>
    </div>
  );
};

// Template 3 (Landscape - Second Image)
export const Template3 = ({ data, certAssets, id }) => {
  return (
    <div id={id} style={{
      position: 'relative', width: '1123px', height: '794px',
      backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif',
      overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
    }}>
      {/* Left-Side Subtle Geometric Polygonal Background Mesh (SVG) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '700px', height: '100%', pointerEvents: 'none', opacity: 0.12 }}>
        <svg width="700" height="794" viewBox="0 0 700 794" style={{ display: 'block' }}>
          <polygon points="0,0 200,0 100,150 0,100" fill="#cbd5e1" />
          <polygon points="100,150 300,120 200,280" fill="#cbd5e1" />
          <polygon points="0,100 100,150 0,300" fill="#94a3b8" />
          <polygon points="0,300 200,280 150,480 0,420" fill="#cbd5e1" />
          <polygon points="200,280 300,120 400,250 350,420" fill="#94a3b8" />
          <polygon points="350,420 400,250 550,300 480,500" fill="#cbd5e1" />
          <polygon points="150,480 350,420 280,620 100,580" fill="#cbd5e1" />
          <polygon points="0,420 150,480 0,600" fill="#94a3b8" />
          <polygon points="0,600 280,620 200,794 0,794" fill="#cbd5e1" />
          <polygon points="280,620 480,500 520,680 400,794" fill="#cbd5e1" />
          <polygon points="400,794 520,680 600,794" fill="#94a3b8" />
        </svg>
      </div>

      {/* Decorative Gold & Blue Accent Dots (Behind right panel) */}
      <div style={{ position: 'absolute', top: '15px', right: '360px', display: 'grid', gridTemplateColumns: 'repeat(6, 8px)', gap: '6px', opacity: 0.7 }}>
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
      <div style={{ position: 'absolute', top: '350px', left: '50px', width: '600px', fontSize: '13px', lineHeight: 1.8, color: '#334155', fontWeight: '500' }}>
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
                {data.chairmanName || "Muhammad Farooq Ahmad"}
              </span>
            )}
          </div>
          <div style={{ width: '220px', height: '1.2px', backgroundColor: '#0f172a', marginBottom: '5px' }} />
          <p style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#0f172a', margin: 0 }}>
            {data.chairmanName || "Muhammad Farooq Ahmad"}
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Chairman SLS
          </p>
        </div>

        {/* Dynamic Verification Seal Circular Stamp (Positioned Overlapping Right-side border area) */}
        <div style={{ marginRight: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <img 
            src={certAssets?.stamp || certAssets?.seal || sealImg} 
            alt="Verified Stamp" 
            style={{ width: '110px', height: '110px', objectFit: 'contain' }} 
          />
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
