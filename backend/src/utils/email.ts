import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

// Create transporter
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter!;
};

/**
 * Generate a 6-digit OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for verification
 */
export const sendOTPEmail = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    // If email is not configured, log the OTP instead (for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("📧 Email not configured. OTP for", email, ":", otp);
      console.log(
        "⚠️ Configure SMTP_USER and SMTP_PASS in .env to send real emails"
      );
      return true; // Return success for development
    }

    const mailOptions = {
      from: `"ILA - Interdisciplinary Learning Analytics" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Email Verification - ILA",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ILA!</h1>
                <p>Verify your email address</p>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Thank you for registering with Interdisciplinary Learning Analytics. To complete your registration, please use the following One-Time Password (OTP):</p>
                
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                
                <p><strong>This code will expire in 10 minutes.</strong></p>
                <p>If you didn't request this verification, please ignore this email.</p>
                
                <div class="footer">
                  <p>&copy; 2025 Interdisciplinary Learning Analytics. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to ILA!

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.

© 2025 Interdisciplinary Learning Analytics. All rights reserved.
      `,
    };

    await getTransporter().sendMail(mailOptions);
    console.log("✓ OTP email sent to:", email);
    return true;
  } catch (error) {
    console.error("✗ Failed to send OTP email:", error);
    return false;
  }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (
  email: string,
  displayName: string
): Promise<boolean> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("📧 Welcome email would be sent to:", email);
      return true;
    }

    const mailOptions = {
      from: `"ILA Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to ILA - Get Started!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ILA, ${displayName}! 🎉</h1>
              </div>
              <div class="content">
                <p>Your email has been successfully verified!</p>
                <p>You can now access all features of our platform:</p>
                <ul>
                  <li>Submit and analyze interdisciplinary essays</li>
                  <li>Get AI-powered feedback within seconds</li>
                  <li>Collaborate with team members on group projects</li>
                  <li>Track your learning progress</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${
                    process.env.CORS_ORIGIN || "http://localhost:5173"
                  }" class="button">Get Started</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await getTransporter().sendMail(mailOptions);
    console.log("✓ Welcome email sent to:", email);
    return true;
  } catch (error) {
    console.error("✗ Failed to send welcome email:", error);
    return false;
  }
};
