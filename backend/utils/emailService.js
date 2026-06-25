const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS environment variables are missing');
  }
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendWelcomeEmail = async (email, name, memberId) => {
  try {
    const transporter = createTransporter();
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

const sendInterviewEmail = async (email, name, venue, message) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Serve & Lead Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: "serveandleadsociety@serveandlead.org",
      subject: 'Interview Invitation: SLS Society Recruitment',
      text: `Dear ${name}, you are invited for an interview at ${venue}. Message: ${message}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="width: 100%; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,33,71,0.15); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #002147 0%, #001a38 100%); padding: 40px 20px; text-align: center; position: relative;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.02em;">Interview Invitation</h1>
              <p style="color: #475569; margin-top: 15px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.7);">Official Recruitment Drive 2026</p>
            </div>
            <div style="padding: 30px 20px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 26px; font-weight: 800;">Dear ${name},</h2>
              <p style="font-size: 17px; color: #475569; margin-bottom: 40px;">Based on your application, we are pleased to invite you for a formal interview to assess your potential alignment with the <strong>Serve & Lead Society (SLS)</strong>.</p>
              
              <div style="margin: 30px 0; background-color: #f8fafc; border-radius: 24px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);">
                <div style="margin-bottom: 30px;">
                  <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #3b82f6; letter-spacing: 0.15em; margin-bottom: 10px;">Scheduled Venue</p>
                  <p style="margin: 0; font-size: 20px; color: #002147; font-weight: 800;">📍 ${venue}</p>
                </div>
                <div>
                  <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #3b82f6; letter-spacing: 0.15em; margin-bottom: 10px;">Message from Recruitment Commitee</p>
                  <p style="margin: 0; font-size: 16px; color: #334155; line-height: 1.8; font-style: italic;">"${message || 'Please bring your printed application and a copy of your CV.'}"</p>
                </div>
              </div>
              
              <div style="background-color: #eff6ff; border-radius: 16px; padding: 25px; border-left: 4px solid #3b82f6; margin-bottom: 40px;">
                <p style="font-size: 14px; color: #1e40af; margin: 0; font-weight: 600;">
                  📌 Preparation: Please arrive 15 minutes early. Dress code is Business Formal.
                </p>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 50px 0;">
              
              <div style="text-align: center;">
                <p style="font-size: 14px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 8px;">Serve & Lead Society (SLS)</p>
                <p style="font-size: 12px; color: #cbd5e1;">Official Registered Organization | Lahore, Pakistan</p>
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

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
        from: `"Serve & Lead Security" <${process.env.EMAIL_USER}>`,
        to: email,
        replyTo: "serveandleadsociety@serveandlead.org",
        subject: 'Your SLS Verification Code',
        text: `Your SLS verification code is: ${otp}. It expires in 5 minutes.`,
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px 10px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
            <div style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                <div style="background-color: #002147; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em;">Verify Your Identity</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #475569; text-align: center; margin-bottom: 40px;">To ensure this Gmail address is active and secure, please use the verification code below to complete your registration:</p>
                    
                    <div style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border-radius: 20px; padding: 30px 20px; text-align: center; border: 2px dashed #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                        <span style="font-size: 48px; font-weight: 900; color: #002147; letter-spacing: 0.3em; font-family: 'Courier New', Courier, monospace; text-shadow: 0 1px 0 #fff;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; font-weight: 600;">
                        Code expires in 5 minutes.
                    </p>
                    
                    <p style="font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 20px;">
                        If you did not request this code, please ignore this communication.
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

const sendFeeRequestedEmail = async (email, name, amount, channels) => {
  try {
    const transporter = createTransporter();
    const loginUrl = `${process.env.FRONTEND_URL || 'https://serveandlead.org'}/login`;
    const channelsHtml = formatChannelsHtml(channels);
    await transporter.sendMail({
      from: `"Serve & Lead Society" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: 'serveandleadsociety@serveandlead.org',
      subject: 'Action Required: Membership Fee Payment',
      text: `Dear ${name}, your membership fee of PKR ${amount} is due. Log in to submit payment proof: ${loginUrl}`,
      html: emailShell('Membership Fee Required', `
        <h2 style="color:#0f172a;margin-top:0;">Dear ${name},</h2>
        <p style="font-size:16px;color:#475569;">Your interview has been completed. To proceed with membership approval, please pay the membership fee of <strong>PKR ${amount}</strong> and submit your payment proof through the member portal.</p>
        <h3 style="color:#002147;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Payment Channels</h3>
        ${channelsHtml}
        <div style="text-align:center;margin-top:32px;">
          <a href="${loginUrl}" style="background-color:#002147;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;text-transform:uppercase;">Log In & Submit Proof</a>
        </div>
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
        <div style="text-align:center;margin-top:24px;">
          <a href="${loginUrl}" style="background-color:#002147;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;">Resubmit Payment Proof</a>
        </div>
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

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendContactEmail,
  sendInterviewEmail,
  sendOTPEmail,
  sendFeeRequestedEmail,
  sendFeeRejectedEmail,
  sendFeeVerifiedEmail,
};
