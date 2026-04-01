const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., 'your_email@gmail.com'
    pass: process.env.EMAIL_PASS, // App Password
  },
});

const sendWelcomeEmail = async (email, name, memberId) => {
  try {
    const mailOptions = {
      from: `"Serve & Lead Society (SLS)" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to SLS Society!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #002147;">Welcome to our society dear ${name}!</h2>
          <p>We are thrilled to let you know that your membership application has been <strong>approved</strong>.</p>
          <p>Your official Membership ID is: <strong style="font-size: 18px; color: #008080;">${memberId}</strong></p>
          <p>You are now an official member of our community. We are excited to have you on board. Log into your member portal to view announcements, upcoming events, and connect with your team.</p>
          <br>
          <p>Best regards,<br><strong>SLS Administration</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending welcome email (check SMTP credentials in .env):', error);
    return false;
  }
};

const sendResetPasswordEmail = async (email, name, resetUrl) => {
  try {
    const mailOptions = {
      from: `"Serve & Lead Society (SLS)" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your SLS Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f6;">
            <div style="background-color: #002147; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; tracking: tight;">Password Reset Request</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #002147; margin-top: 0;">Hello ${name},</h2>
              <p>We received a request to reset the password for your **SLS Society Portal** account.</p>
              <p>To proceed with setting a new password, please click the secure button below:</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="background-color: #002147; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Reset My Password</a>
              </div>
              
              <p style="font-size: 13px; color: #64748b;">This link will expire in **10 minutes** for your security. If you did not request this change, please ignore this email or contact support if you have concerns.</p>
              
              <hr style="border: 0; border-top: 1px solid #eef2f6; margin: 40px 0;">
              
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                <strong>Serve & Lead Society (SLS)</strong><br>
                Empowering Leadership & Professional Excellence
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reset email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
};

const sendContactEmail = async (name, email, message) => {
  try {
    const mailOptions = {
      from: `"SLS Portal" <${process.env.EMAIL_USER}>`,
      to: 'shahbazyounas636@gmail.com',
      subject: `New Society Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; tracking: tight; text-transform: uppercase;">New Website Inquiry</h1>
            </div>
            <div style="padding: 40px;">
              <div style="margin-bottom: 30px;">
                <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 1px; margin-bottom: 5px;">Sender Details</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a;"><strong>${name}</strong></p>
                <p style="margin: 0; font-size: 14px; color: #6366f1;">${email}</p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #6366f1;">
                <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 1px; margin-bottom: 10px;">Message Content</p>
                <p style="margin: 0; font-size: 15px; color: #334155; white-space: pre-wrap;">${message}</p>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
              
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                This message was sent via the **Serve & Lead Society** contact form.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Contact email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
};

const sendInterviewEmail = async (email, name, venue, message) => {
  try {
    const mailOptions = {
      from: `"Serve & Lead Society (SLS) Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Interview Call: SLS Society Recruitment',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f1f5f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,33,71,0.08); border: 1px solid #e2e8f0;">
            <div style="background-color: #002147; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Interview Invitation</h1>
              <p style="color: #94a3b8; margin-top: 10px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Official Recruitment Call</p>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Dear ${name},</h2>
              <p style="font-size: 16px; color: #475569;">We are impressed with your application and would like to invite you for an interview to further assess your fitness for the **Serve & Lead Society (SLS)**.</p>
              
              <div style="margin: 35px 0; background-color: #f8fafc; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 20px;">
                  <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.1em; margin-bottom: 8px;">Interview Venue</p>
                  <p style="margin: 0; font-size: 17px; color: #002147; font-weight: 700;">${venue}</p>
                </div>
                <div>
                  <p style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.1em; margin-bottom: 8px;">Message from Admin</p>
                  <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.7; font-style: italic;">"${message || 'Please bring your printed application and a copy of your CV.'}"</p>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #64748b; margin-top: 40px;">Please ensure you arrive at least 10 minutes before the scheduled time. Dress code is formal/business casual.</p>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
              
              <div style="text-align: center;">
                <p style="font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">Serve & Lead Society (SLS)</p>
                <p style="font-size: 11px; color: #cbd5e1; margin-top: 5px;">Empowering Future Leaders through Excellence</p>
              </div>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Interview email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending interview email:', error);
    return false;
  }
};

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
        from: `"SLS Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SLS Registration: Your Verification Code',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #f8fafc;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div style="background-color: #002147; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Verify Your Gmail</h1>
                </div>
                <div style="padding: 40px;">
                    <p style="font-size: 16px; color: #475569; text-align: center; margin-bottom: 30px;">To ensure this Gmail address is active and owned by you, please use the verification code below to complete your registration:</p>
                    
                    <div style="background-color: #f1f5f9; border-radius: 16px; padding: 25px; text-align: center; border: 1px dashed #cbd5e1;">
                        <span style="font-size: 42px; font-weight: 900; color: #002147; letter-spacing: 0.2em; font-family: monospace;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 30px;">
                        This code is valid for **10 minutes**. If you did not request this, please ignore this email.
                    </p>
                </div>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('OTP Email Error:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendContactEmail,
  sendInterviewEmail,
  sendOTPEmail
};
