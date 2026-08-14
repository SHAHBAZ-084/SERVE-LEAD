const nodemailer = require('nodemailer');
const crypto = require('crypto');

const mailFromAddress = () => String(process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();
const mailFromDomain = () => {
  const addr = mailFromAddress();
  const at = addr.lastIndexOf('@');
  return at > 0 ? addr.slice(at + 1) : 'serveandlead.org';
};

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS environment variables are missing');
  }
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    name: mailFromDomain(),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { minVersion: 'TLSv1.2' },
  });
};

const sendWelcomeEmail = async (email, name, memberId, membershipValidUntil) => {
  try {
    const transporter = createTransporter();
    const validUntilText = membershipValidUntil
      ? new Date(membershipValidUntil).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;
    const mailOptions = {
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: "serveandleadsociety@serveandlead.org",
      subject: 'Welcome to SLS Society: Membership Approved',
      text: `Welcome to Serve & Lead Society, ${name}! Your membership has been approved. Your Member ID is: ${memberId}. Login at: ${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,33,71,0.1); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #002147 0%, #004080 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welcome to the Society</h1>
              <p style="color: #94a3b8; margin-top: 15px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Official Acceptance Notification</p>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700;">Dear ${name},</h2>
              <p style="font-size: 17px; color: #475569;">We are thrilled to inform you that your membership application has been <strong>officially approved</strong> by the SLS Board.</p>
              
              <div style="margin: 30px 0; background: linear-gradient(to right, #f1f5f9, #ffffff); border-radius: 20px; padding: 25px; border-left: 6px solid #002147;">
                <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.15em; margin-bottom: 10px;">Your Official Membership ID</p>
                <p style="margin: 0; font-size: 32px; color: #002147; font-weight: 900; letter-spacing: 1px;">${memberId}</p>
              </div>
              
              <p style="font-size: 16px; color: #475569; margin-bottom: 30px;">You are now an official member of our community. We are excited to have you on board. Log into your member portal to view announcements, upcoming events, and connect with your team.</p>
              ${validUntilText ? `<div style="margin: 20px 0; background:#eff6ff;border-radius:16px;padding:16px;border-left:4px solid #3b82f6;"><p style="margin:0;color:#1e40af;font-weight:600;">Your membership is valid until <strong>${validUntilText}</strong>.</p></div>` : ''}
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #002147; color: #ffffff; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(0,33,71,0.2);">Login to Member Portal</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 50px 0;">
              
              <div style="text-align: center;">
                <p style="font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 5px;">Serve & Lead Society (SLS)</p>
                <p style="font-size: 11px; color: #cbd5e1;">Official Registered Organization | Lahore, Pakistan</p>
                <p style="font-size: 10px; color: #94a3b8; margin-top: 20px;">You received this because your membership was approved. If this was a mistake, please reply to this email.</p>
              </div>
            </div>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendResetPasswordEmail = async (email, name, resetUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Serve & Lead Security" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: "serveandleadsociety@serveandlead.org",
      subject: 'Reset Your SLS Society Password',
      text: `Hello ${name}, we received a request to reset your password. Use this link: ${resetUrl}. Links expires in 10 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; tracking: -0.01em;">Password Reset</h1>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
              <p style="color: #475569; font-size: 16px;">We received a request to reset the password for your <strong>SLS Society Portal</strong> account.</p>
              <p style="color: #475569; font-size: 16px; margin-bottom: 40px;">To proceed with setting a new password, please click the secure button below:</p>
              
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${resetUrl}" style="background-color: #002147; color: #ffffff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block; box-shadow: 0 8px 15px rgba(0,33,71,0.2);">Reset My Password</a>
              </div>
              
              <div style="background-color: #fff9f0; border: 1px solid #ffedd5; border-radius: 12px; padding: 15px 20px; margin-bottom: 30px;">
                <p style="font-size: 13px; color: #9a3412; margin: 0; font-weight: 600;">
                  Please note: This link will expire in 10 minutes for your security.
                </p>
              </div>
              
              <p style="font-size: 13px; color: #94a3b8; text-align: center;">If you did not request this change, please ignore this email or contact support if you have concerns.</p>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
              
              <p style="font-size: 11px; color: #cbd5e1; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                Serve & Lead Society Security Team
              </p>
            </div>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendContactEmail = async (name, email, message) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Serve & Lead Portal" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || 'serveandleadsociety@serveandlead.org',
      replyTo: email, // Allow reply directly to the person who contacted
      subject: `New Inquiry from ${name}`,
      text: `New Website Inquiry from ${name} (${email}): ${message}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 20px; border-bottom: 4px solid #3b82f6;">
              <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">New Website Inquiry</h1>
            </div>
            <div style="padding: 20px;">
              <div style="margin-bottom: 35px; background-color: #f1f5f9; padding: 20px; border-radius: 12px;">
                <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 8px;">Contact Information</p>
                <p style="margin: 0; font-size: 17px; color: #0f172a; font-weight: 700;">${name}</p>
                <p style="margin: 0; font-size: 14px; color: #3b82f6; font-weight: 600;">${email}</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative;">
                <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 12px;">Message Details</p>
                <div style="font-size: 15px; color: #334155; white-space: pre-wrap; line-height: 1.8;">${message}</div>
              </div>
              
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px;">
                Generated by the **Serve & Lead Society** Contact Form Automator | Lahore, Pakistan
              </p>
            </div>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendInterviewEmail = async (email, name, details) => {
  const {
    venue = '',
    message = '',
    dressCode = '',
    arrivalTime = '',
    guideNotes = '',
    focusAreas = '',
    linkUrl = '',
  } = details || {};

  const optionalBlock = (label, value) => value
    ? `<div style="margin-bottom:16px;"><p style="text-transform:uppercase;font-size:11px;font-weight:900;color:#3b82f6;letter-spacing:0.15em;margin-bottom:6px;">${label}</p><p style="margin:0;font-size:15px;color:#334155;line-height:1.7;">${value}</p></div>`
    : '';

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Serve & Lead Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: "serveandleadsociety@serveandlead.org",
      subject: 'Interview Invitation: SLS Society Recruitment',
      text: `Dear ${name}, you are invited for an interview at ${venue}. ${message}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="width: 100%; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,33,71,0.15); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #002147 0%, #001a38 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900;">Interview Invitation</h1>
              <p style="margin-top: 15px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.7);">Official Recruitment Drive</p>
            </div>
            <div style="padding: 30px 24px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 26px; font-weight: 800;">Dear ${name},</h2>
              <p style="font-size: 17px; color: #475569; margin-bottom: 24px;">You are invited for a formal interview with the <strong>Serve & Lead Society (SLS)</strong>.</p>
              <div style="margin: 24px 0; background-color: #f8fafc; border-radius: 24px; padding: 25px; border: 1px solid #e2e8f0;">
                ${optionalBlock('Venue / Location', venue ? `📍 ${venue}` : '')}
                ${optionalBlock('Arrival Time', arrivalTime)}
                ${optionalBlock('Dress Code', dressCode)}
                ${optionalBlock('Interview Guide', guideNotes)}
                ${optionalBlock('Focus Areas', focusAreas)}
                ${linkUrl ? optionalBlock('Reference Link', `<a href="${linkUrl}" style="color:#002147;">${linkUrl}</a>`) : ''}
                ${optionalBlock('Message from Recruitment Committee', message ? `"${message}"` : '')}
              </div>
              <p style="font-size: 14px; color: #64748b; text-align: center;">Serve & Lead Society (SLS) | Lahore, Pakistan</p>
            </div>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendInterviewPassedEmail = async (email, name, note) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`;
    await transporter.sendMail({
      from: `"Serve & Lead Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Congratulations — Interview Passed',
      html: emailShell('Interview Passed', `
        <h2 style="color:#0f172a;margin-top:0;">Congratulations, ${name}!</h2>
        <p style="font-size:16px;color:#475569;">We are pleased to inform you that you have <strong style="color:#059669;">passed</strong> your SLS membership interview.</p>
        <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#065f46;"><strong>Committee note:</strong> ${note}</p>
        </div>
        <p style="color:#475569;">You will receive a separate email when your membership fee payment is requested. Please log in to the member portal to stay updated.</p>
        <div style="text-align:center;margin-top:24px;">
          ${emailActionButton(loginUrl, 'Member Portal')}
        </div>
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendInterviewFailedEmail = async (email, name, note) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Serve & Lead Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'SLS Interview Outcome',
      html: emailShell('Application Update', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Thank you for your interest in the Serve & Lead Society and for attending the interview process.</p>
        <p style="font-size:16px;color:#475569;">After careful review, we regret to inform you that your application will not proceed further at this time.</p>
        <div style="background:#fff1f2;border-left:4px solid #f43f5e;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#9f1239;"><strong>Note:</strong> ${note}</p>
        </div>
        <p style="color:#64748b;">We appreciate your effort and wish you the very best in your future endeavors.</p>
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    const fromAddr = mailFromAddress();
    const domain = mailFromDomain();
    const mailOptions = {
        from: { name: 'Serve and Lead Society', address: fromAddr },
        to: email,
        replyTo: fromAddr,
        subject: `${otp} is your Serve and Lead Society verification code`,
        text:
          `Hello,\n\n` +
          `Your Serve and Lead Society verification code is ${otp}.\n\n` +
          `This code expires in 5 minutes.\n\n` +
          `If you did not request this code, you can ignore this email.\n\n` +
          `Serve and Lead Society\nhttps://serveandlead.org\n`,
        html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px 16px;">
          <p style="margin: 0 0 16px; font-size: 16px;">Hello,</p>
          <p style="margin: 0 0 16px; font-size: 16px;">Your Serve and Lead Society verification code is:</p>
          <p style="margin: 0 0 24px; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #002147;">${otp}</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">This code expires in 5 minutes.</p>
          <p style="margin: 0 0 24px; font-size: 13px; color: #64748b;">If you did not request this code, you can ignore this email.</p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Serve and Lead Society<br/>https://serveandlead.org</p>
        </div>
        `,
        headers: {
          'Message-ID': `<otp.${Date.now()}.${crypto.randomBytes(6).toString('hex')}@${domain}>`,
        },
        date: new Date(),
    };
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const emailShell = (title, bodyHtml) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,33,71,0.1); border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #002147 0%, #004080 100%); padding: 32px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">${title}</h1>
      </div>
      <div style="padding: 40px 32px;">${bodyHtml}</div>
      <div style="padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">Serve & Lead Society (SLS) | Lahore, Pakistan</p>
      </div>
    </div>
  </div>
`;

/** Table-based CTA button — renders reliably in Gmail/mobile email clients. */
const emailActionButton = (href, line1, line2 = '') => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto 0 auto;">
    <tr>
      <td align="center" bgcolor="#002147" style="border-radius:12px;background-color:#002147;">
        <a href="${href}" target="_blank" rel="noopener noreferrer"
          style="display:block;padding:16px 28px;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;line-height:1.45;text-align:center;min-width:200px;box-sizing:border-box;">
          <span style="display:block;color:#ffffff;">${line1}</span>${line2 ? `<span style="display:block;color:#ffffff;font-size:13px;font-weight:600;margin-top:4px;">${line2}</span>` : ''}
        </a>
      </td>
    </tr>
  </table>
`;

const formatChannelsHtml = (channels) => {
  if (!channels?.length) return '<p style="color:#64748b;">Contact administration for payment details.</p>';
  return channels.map((ch) => {
    if (ch.type === 'Bank') {
      return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:8px;border-left:4px solid #002147;">
        <strong>${ch.bankName || 'Bank'}</strong><br/>
        Account: ${ch.accountNumber || 'N/A'}<br/>
        IBAN: ${ch.iban || 'N/A'}
      </div>`;
    }
    return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:8px;border-left:4px solid #10b981;">
      <strong>${ch.walletType || 'Wallet'}</strong><br/>
      Number: ${ch.number || 'N/A'}
    </div>`;
  }).join('');
};

const sendFeeRequestedEmail = async (email, name, amount, channels, deadline, validityMonths = 12, adminMessage = '', options = {}) => {
  const { isRetry = false, previousAmount = null } = options;
  try {
    const transporter = createTransporter();
    const portalUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login?redirect=${encodeURIComponent('/dashboard?fee=submit')}`;
    const channelsHtml = formatChannelsHtml(channels);
    const deadlineText = deadline
      ? new Date(deadline).toLocaleDateString('en-PK', { dateStyle: 'full' })
      : 'As communicated by administration';
    const messageBlock = adminMessage
      ? `<div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;border-radius:8px;margin:20px 0;"><p style="margin:0;color:#0c4a6e;"><strong>Message from administration:</strong> ${adminMessage}</p></div>`
      : '';
    const retryNotice = isRetry
      ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#92400e;font-weight:700;">Your fee payment needs to be updated.${previousAmount != null ? ` Previous requested amount: PKR ${previousAmount}.` : ''}</p>
          <p style="margin:8px 0 0;color:#78350f;font-size:14px;">Please pay the revised amount below and submit fresh payment proof through the membership portal.</p>
        </div>`
      : '';
    const intro = isRetry
      ? 'Please review the updated membership fee details below.'
      : 'Congratulations on passing your interview. Please pay your membership fee and submit payment proof through the membership portal.';
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: isRetry ? 'Updated Membership Fee Required' : 'Action Required: Membership Fee Payment',
      text: `Dear ${name}, membership fee PKR ${amount} due by end of ${deadlineText}. Membership valid for ${validityMonths} months. Submit proof: ${portalUrl}`,
      html: emailShell(isRetry ? 'Updated Fee Required' : 'Membership Fee Required', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">${intro}</p>
        ${retryNotice}
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">${isRetry ? 'Revised Fee Amount' : 'Fee Amount'}</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#002147;">PKR ${amount}</p>
          <p style="margin:12px 0 0;color:#475569;font-size:14px;"><strong>Membership duration:</strong> ${validityMonths} month${validityMonths === 1 ? '' : 's'} from approval</p>
          <p style="margin:8px 0 0;color:#92400e;font-size:14px;font-weight:700;"><strong>Payment deadline:</strong> by end of ${deadlineText}</p>
        </div>
        ${messageBlock}
        <h3 style="color:#002147;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Payment Channels</h3>
        ${channelsHtml}
        ${emailActionButton(portalUrl, 'Open Membership Portal', 'Submit Payment Proof')}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Log in with your registered email if prompted. For issues, use WhatsApp support in the member portal.</p>
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendFeeRejectedEmail = async (email, name, reason) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`;
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Fee Submission Rejected',
      text: `Dear ${name}, your fee submission was rejected. Reason: ${reason}. Please resubmit at ${loginUrl}`,
      html: emailShell('Fee Submission Rejected', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Your membership fee payment proof could not be verified.</p>
        <div style="background:#fff1f2;border-left:4px solid #f43f5e;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#9f1239;font-weight:600;">Reason: ${reason}</p>
        </div>
        <p style="color:#475569;">Please log in and submit corrected payment proof.</p>
        ${emailActionButton(loginUrl, 'Resubmit Payment Proof')}
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendFeeWaivedEmail = async (email, name, reason) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`;
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Complimentary Membership — Fee Waived',
      html: emailShell('Membership Fee Waived', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Your membership fee has been <strong style="color:#7c3aed;">waived</strong> by the administration. You have been granted complimentary membership consideration.</p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#5b21b6;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="color:#475569;">Final membership approval is pending. You will receive another email once your membership is fully approved.</p>
        ${emailActionButton(loginUrl, 'Member Portal')}
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendFeeVerifiedEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Payment Verified — Awaiting Final Approval',
      text: `Dear ${name}, your membership fee payment has been verified. Final approval is pending.`,
      html: emailShell('Payment Verified', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Your membership fee payment has been <strong style="color:#059669;">verified</strong>. Our administration team will complete your final membership approval shortly.</p>
        <p style="color:#64748b;font-size:14px;">No further action is required from you at this time.</p>
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendExecutiveApprovedEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    const portalUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`;
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Congratulations — Executive Membership Approved',
      text: `Dear ${name}, your application for Executive membership has been approved. Log in at ${portalUrl}`,
      html: emailShell('Executive Membership Approved', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Congratulations! The board has <strong style="color:#059669;">approved</strong> your application for Executive membership.</p>
        <p style="color:#64748b;font-size:14px;">You now hold Executive Member status in Serve & Lead Society. Log in to your member portal to access executive privileges and upcoming leadership opportunities.</p>
        ${emailActionButton(portalUrl, 'Login to Member Portal', 'Access your executive dashboard')}
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

const sendExecutiveRejectedEmail = async (email, name, reason) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Executive Membership Application — Decision',
      text: `Dear ${name}, your executive membership application was not approved at this time. Reason: ${reason}`,
      html: emailShell('Application Not Approved', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Thank you for your interest in Executive membership. After careful review, the board has decided not to approve your application at this time.</p>
        <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#991b1b;font-weight:700;">Reason:</p>
          <p style="margin:8px 0 0;color:#7f1d1d;font-size:14px;">${reason}</p>
        </div>
        <p style="color:#64748b;font-size:14px;">You remain a valued General Member of the society. We encourage you to continue contributing and consider reapplying in the future.</p>
      `),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendContactEmail,
  sendInterviewEmail,
  sendOTPEmail,
  sendFeeRequestedEmail,
  sendFeeRejectedEmail,
  sendFeeWaivedEmail,
  sendFeeVerifiedEmail,
  sendInterviewPassedEmail,
  sendInterviewFailedEmail,
  sendExecutiveApprovedEmail,
  sendExecutiveRejectedEmail,
};
