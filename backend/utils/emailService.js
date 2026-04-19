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
      subject: 'Welcome to SLS Society: Membership Approved',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,33,71,0.1); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #002147 0%, #004080 100%); padding: 50px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welcome to the Society</h1>
              <p style="color: #94a3b8; margin-top: 15px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Official Acceptance Notification</p>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700;">Dear ${name},</h2>
              <p style="font-size: 17px; color: #475569;">We are thrilled to inform you that your membership application has been <strong>officially approved</strong> by the SLS Board.</p>
              
              <div style="margin: 40px 0; background: linear-gradient(to right, #f1f5f9, #ffffff); border-radius: 20px; padding: 35px; border-left: 6px solid #002147;">
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
                <p style="font-size: 11px; color: #cbd5e1;">Empowering Future Leaders through Excellence & Integrity</p>
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
      from: `"SLS Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your SLS Society Password',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 40px; text-align: center;">
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
      from: `"SLS Portal Notification" <${process.env.EMAIL_USER}>`,
      to: 'shahbazyounas636@gmail.com',
      subject: `New Inquiry from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 25px 40px; border-bottom: 4px solid #3b82f6;">
              <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">New Website Inquiry</h1>
            </div>
            <div style="padding: 40px;">
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
                Generated by the **Serve & Lead Society** Contact Form Automator.
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
      from: `"SLS Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Interview Invitation: SLS Society Recruitment',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,33,71,0.15); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #002147 0%, #001a38 100%); padding: 60px 40px; text-align: center; position: relative;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.02em;">Interview Invitation</h1>
              <p style="color: #475569; margin-top: 15px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.7);">Official Recruitment Drive 2026</p>
            </div>
            <div style="padding: 60px 50px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 26px; font-weight: 800;">Dear ${name},</h2>
              <p style="font-size: 17px; color: #475569; margin-bottom: 40px;">Based on your application, we are pleased to invite you for a formal interview to assess your potential alignment with the <strong>Serve & Lead Society (SLS)</strong>.</p>
              
              <div style="margin: 40px 0; background-color: #f8fafc; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);">
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
                <p style="font-size: 12px; color: #cbd5e1;">Developing Tomorrow's Leaders Today</p>
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
        from: `"SLS Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SLS Verification Code: ' + otp,
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                <div style="background-color: #002147; padding: 50px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.03em;">Verify Your Identity</h1>
                </div>
                <div style="padding: 50px 40px;">
                    <p style="font-size: 16px; color: #475569; text-align: center; margin-bottom: 40px;">To ensure this Gmail address is active and secure, please use the verification code below to complete your registration:</p>
                    
                    <div style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border-radius: 20px; padding: 40px; text-align: center; border: 2px dashed #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                        <span style="font-size: 48px; font-weight: 900; color: #002147; letter-spacing: 0.3em; font-family: 'Courier New', Courier, monospace; text-shadow: 0 1px 0 #fff;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; font-weight: 600;">
                        Code expires in 10 minutes.
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

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendContactEmail,
  sendInterviewEmail,
  sendOTPEmail
};
