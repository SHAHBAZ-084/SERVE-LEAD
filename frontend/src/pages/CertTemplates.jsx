import logo from "../assets/logo.png";
import sealImg from "../assets/sealcertificate.png";
export { logo, sealImg };

export const Template1 = ({ data, certAssets, id }) => (
  <div id={id} style={{
    position: 'relative', width: '794px', height: '1123px',
    backgroundColor: '#ffffff', fontFamily: '"Playfair Display", serif',
    overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
  }}>
    {/* Top-right blue geometric triangles */}
    <div style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '200px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', backgroundColor: '#003366', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
      <div style={{ position: 'absolute', top: '10px', right: '40px', width: '100px', height: '100px', backgroundColor: '#1a8cff', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', opacity: 0.7 }} />
      <div style={{ position: 'absolute', top: '-10px', right: '100px', width: '80px', height: '80px', backgroundColor: '#66b3ff', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', opacity: 0.5 }} />
    </div>

    {/* Bottom-left blue geometric triangles */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '160px', height: '160px', backgroundColor: '#003366', clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />
      <div style={{ position: 'absolute', bottom: '20px', left: '40px', width: '100px', height: '100px', backgroundColor: '#1a8cff', clipPath: 'polygon(0 100%, 0 0, 100% 100%)', opacity: 0.6 }} />
    </div>

    {/* Double border */}
    <div style={{ position: 'absolute', top: '14px', bottom: '14px', left: '14px', right: '14px', border: '1.5px solid #002147', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: '19px', bottom: '19px', left: '19px', right: '19px', border: '1px solid #002147', pointerEvents: 'none' }} />

    {/* Logo top-left */}
    <div style={{ position: 'absolute', top: '40px', left: '40px' }}>
      <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
    </div>

    {/* Date top-left below logo */}
    <div style={{ position: 'absolute', top: '130px', left: '40px', fontSize: '12px', color: '#334155' }}>
      Date of Issue: {new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>

    {/* Main title centered */}
    <div style={{ paddingTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '64px', fontWeight: '900', color: '#003366', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, margin: 0, textAlign: 'center' }}>
        {data.title || "CERTIFICATE"}
      </h1>
      <p style={{ fontSize: '28px', fontStyle: 'italic', color: '#003366', margin: '8px 0', textAlign: 'center' }}>
        {data.awardType || "Of Participation"}
      </p>
      <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', marginTop: '8px' }}>
        This certificate is presented to
      </p>
    </div>

    {/* Recipient name */}
    <div style={{ textAlign: 'center', marginTop: '32px', padding: '0 60px' }}>
      <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1a1a1a', fontFamily: '"Playfair Display", serif', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        {data.memberId?.name || "Member Name"}
      </h2>
    </div>

    {/* Body text */}
    <div style={{ textAlign: 'center', marginTop: '32px', padding: '0 80px', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: 1.7, color: '#334155', fontStyle: 'italic' }}>
      <p>{data.description || "The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session."}</p>
    </div>

    {/* Signature + Stamp row */}
    <div style={{ position: 'absolute', bottom: '90px', left: '100px', right: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {certAssets?.signature
          ? <img src={certAssets.signature} alt="Signature" style={{ height: '70px', objectFit: 'contain', marginBottom: '4px' }} />
          : <p style={{ fontSize: '32px', fontFamily: '"Dancing Script", cursive', color: '#1e293b' }}>{data.chairmanName || "M Farooq Ahmad"}</p>
        }
        <div style={{ width: '180px', height: '1px', backgroundColor: '#0f172a', marginBottom: '6px' }} />
        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a', margin: 0 }}>{data.chairmanName || "M Farooq Ahmad"}</p>
        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>CEO of Society</p>
      </div>

      <div>
        {certAssets?.stamp
          ? <img src={certAssets.stamp} alt="Stamp" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
          : <img src={certAssets?.seal || sealImg} alt="Seal" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
        }
      </div>
    </div>

    {/* Footer */}
    <div style={{ position: 'absolute', bottom: '40px', left: 0, width: '100%', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
      Verify Through SLS Website by Using Membership ID
    </div>
  </div>
);

export const Template2 = ({ data, certAssets, id }) => (
  <div id={id} style={{
    position: 'relative', width: '1123px', height: '794px',
    backgroundColor: '#ffffff', fontFamily: '"Playfair Display", serif',
    overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
  }}>
    {/* Blue accent left edge */}
    <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '100%', backgroundColor: '#1a56db', opacity: 0.15 }} />
    {/* Blue corner top-left */}
    <div style={{ position: 'absolute', top: 0, left: 0, width: '250px', height: '120px', background: 'linear-gradient(135deg, #1a56db 60%, transparent 100%)' }} />
    {/* Blue corner bottom-right */}
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '250px', height: '120px', background: 'linear-gradient(315deg, #1a56db 60%, transparent 100%)' }} />

    {/* Logo top-right */}
    <div style={{ position: 'absolute', top: '30px', right: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '65px', objectFit: 'contain' }} />
    </div>

    {/* Main title top-left */}
    <div style={{ position: 'absolute', top: '40px', left: '100px' }}>
      <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#ffffff', margin: 0, lineHeight: 1 }}>{data.title || "Certificate"}</h1>
      <p style={{ fontSize: '20px', color: '#ffffff', margin: '4px 0 0', fontFamily: 'sans-serif' }}>{data.awardType || "of Participation"}</p>
      <p style={{ fontSize: '14px', color: '#e2e8f0', fontFamily: 'sans-serif', marginTop: '4px' }}>presented to :</p>
    </div>

    {/* Recipient name */}
    <div style={{ textAlign: 'center', marginTop: '180px' }}>
      <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a1a1a', fontFamily: '"Playfair Display", serif', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        {data.memberId?.name || "Member Name"}
      </h2>
    </div>

    {/* Body text */}
    <div style={{ textAlign: 'center', marginTop: '20px', padding: '0 100px', fontFamily: 'sans-serif', fontSize: '13px', lineHeight: 1.7, color: '#334155', fontStyle: 'italic' }}>
      <p>{data.description || "The participant actively engaged in the orientation, practical demonstration, assessment, and interactive Q&A session."}</p>
    </div>

    {/* Signature + Stamp */}
    <div style={{ position: 'absolute', bottom: '60px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {certAssets?.signature
          ? <img src={certAssets.signature} alt="Signature" style={{ height: '60px', objectFit: 'contain', marginBottom: '4px' }} />
          : <p style={{ fontSize: '28px', fontFamily: '"Dancing Script", cursive', color: '#1e293b' }}>{data.chairmanName || "M Farooq Ahmad"}</p>
        }
        <div style={{ width: '160px', height: '1px', backgroundColor: '#0f172a', marginBottom: '6px' }} />
        <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', margin: 0 }}>{data.chairmanName || "M Farooq Ahmad"}</p>
        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Chairman SLS</p>
      </div>

      <div>
        {certAssets?.stamp
          ? <img src={certAssets.stamp} alt="Stamp" style={{ width: '110px', height: '110px', objectFit: 'contain' }} />
          : <img src={certAssets?.seal || sealImg} alt="Seal" style={{ width: '110px', height: '110px', objectFit: 'contain' }} />
        }
      </div>

      <div style={{ width: '160px', height: '1px', backgroundColor: '#0f172a' }} />
    </div>

    {/* Footer */}
    <div style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
      Verify Through SLS Website by Using Membership ID
    </div>
  </div>
);

export const Template3 = ({ data, certAssets, id }) => (
  <div id={id} style={{
    position: 'relative', width: '1123px', height: '794px',
    backgroundColor: '#ffffff', fontFamily: 'sans-serif',
    overflow: 'hidden', boxSizing: 'border-box', color: '#0f172a'
  }}>
    {/* Right side — blue & gold geometric block */}
    <div style={{ position: 'absolute', top: 0, right: 0, width: '320px', height: '100%' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '55%', backgroundColor: '#1a56db' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '45%', backgroundColor: '#003366' }} />
      {/* Gold diagonal stripe */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', width: '8px', height: '90%', backgroundColor: '#c8a951', borderRadius: '4px' }} />
      {/* White dot accent */}
      <div style={{ position: 'absolute', top: '50%', right: '50%', width: '12px', height: '12px', backgroundColor: '#ffffff', borderRadius: '50%', transform: 'translate(50%, -50%)' }} />
      {/* Green diagonal lines */}
      <div style={{ position: 'absolute', bottom: '60px', right: '60px', width: '60px', height: '3px', backgroundColor: '#22c55e', transform: 'rotate(-45deg)' }} />
      <div style={{ position: 'absolute', bottom: '80px', right: '50px', width: '40px', height: '3px', backgroundColor: '#22c55e', transform: 'rotate(-45deg)' }} />
      {/* Stamp bottom-right */}
      <div style={{ position: 'absolute', bottom: '30px', right: '30px' }}>
        {certAssets?.stamp
          ? <img src={certAssets.stamp} alt="Stamp" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          : <img src={certAssets?.seal || sealImg} alt="Seal" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
      }
      </div>
    </div>

    {/* Gold dots top-right (behind block) */}
    <div style={{ position: 'absolute', top: '10px', right: '310px', display: 'grid', gridTemplateColumns: 'repeat(6, 8px)', gap: '6px' }}>
      {Array(24).fill(0).map((_, i) => (
        <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#c8a951', borderRadius: '50%', opacity: 0.6 }} />
      ))}
    </div>

    {/* Logo top-left */}
    <div style={{ position: 'absolute', top: '30px', left: '40px' }}>
      <img src={certAssets?.logo || logo} alt="Logo" style={{ height: '75px', objectFit: 'contain' }} />
    </div>

    {/* Main title */}
    <div style={{ position: 'absolute', top: '120px', left: '40px', right: '340px' }}>
      <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
        {data.title || "CERTIFICATE"}
      </h1>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a56db', margin: '4px 0 0' }}>{data.awardType || "OF PARTICIPATION"}</p>
      <p style={{ fontSize: '16px', color: '#334155', marginTop: '8px' }}>This Certificate Is Proudly Presented To</p>
    </div>

    {/* Name with line */}
    <div style={{ position: 'absolute', top: '260px', left: '40px', right: '340px' }}>
      <div style={{ width: '80%', height: '1px', backgroundColor: '#0f172a', marginBottom: '12px' }} />
      <h2 style={{ fontSize: '40px', fontWeight: 'bold', color: '#1a1a1a', fontFamily: '"Playfair Display", serif', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
        {data.memberId?.name || "Member Name"}
      </h2>
    </div>

    {/* Body text */}
    <div style={{ position: 'absolute', top: '360px', left: '40px', right: '340px', fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
      <p>{data.description || "Your dedication to personal branding & professional growth is truly appreciated. We commend your commitment to enhancing your digital presence & career development."}</p>
    </div>

    {/* Signature */}
    <div style={{ position: 'absolute', bottom: '60px', left: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {certAssets?.signature
        ? <img src={certAssets.signature} alt="Signature" style={{ height: '60px', objectFit: 'contain', marginBottom: '4px' }} />
        : <p style={{ fontSize: '28px', fontFamily: '"Dancing Script", cursive', color: '#1e293b', margin: 0 }}>{data.chairmanName || "Muhammad Farooq Ahmad"}</p>
      }
      <div style={{ width: '200px', height: '1px', backgroundColor: '#0f172a', marginTop: '4px', marginBottom: '6px' }} />
      <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a', margin: 0 }}>{data.chairmanName || "Muhammad Farooq Ahmad"}</p>
      <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', margin: 0 }}>Chairman SLS</p>
    </div>

    {/* Footer + branding */}
    <div style={{ position: 'absolute', bottom: '20px', left: '40px', right: '340px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <p style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Verify Through SLS Website by Using Membership ID</p>
      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#003366', margin: 0 }}>SERVE & LEAD SOCIETY</p>
    </div>
  </div>
);
