import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  // --------------------------
  // Send OTP Email
  // --------------------------
  async sendOTP(email: string, otp: string) {
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background-color: #f9f9f9; border: 1px solid #e0e0e0; text-align: center;">
        <div style="margin-bottom: 30px;">
          <img src="https://i.imgur.com/9h8H3eV.png" alt="Idea-Investor Matcher Logo" width="120" style="margin-bottom: 20px;" />
          <h1 style="color: #1e3a8a; font-size: 28px; margin: 0;">Welcome to Idea-Investor Matcher!</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          Thank you for joining our platform, where innovators meet investors. To complete your registration and activate your account, please use the verification code below:
        </p>
        <div style="margin: 25px 0; padding: 20px; background: #e0f2fe; border-radius: 8px; display: inline-block;">
          <h2 style="font-size: 36px; letter-spacing: 4px; color: #0284c7; margin: 0;">${otp}</h2>
        </div>
        <p style="color: #374151; font-size: 14px; margin-bottom: 10px;">
          This code will expire in <strong>10 minutes</strong>. Please enter it in the app to verify your email.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
          If you did not request this code, you can safely ignore this email. Your account will not be activated without this verification.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} Idea-Investor Matcher. All rights reserved.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: '🔒 Verify Your Email - Idea-Investor Matcher',
      html: htmlContent,
    });
  }

  // --------------------------
  // Send Reset Password Email
  // --------------------------
  async sendResetPassword(email: string, resetLink: string) {
    console.log("Reset link being sent:", resetLink); // Debug log to check the reset link value
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background-color: #f9f9f9; border: 1px solid #e0e0e0; text-align: center;">
        <div style="margin-bottom: 30px;">
          <img src="https://i.imgur.com/9h8H3eV.png" alt="Idea-Investor Matcher Logo" width="120" style="margin-bottom: 20px;" />
          <h1 style="color: #1e3a8a; font-size: 28px; margin: 0;">Reset Your Password</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          We received a request to reset your password. Click the button below to set a new password for your account:
        </p>
       <div style="margin: 25px 0; text-align: center;">
  <a 
    href="${resetLink}" 
    target="_blank"
    style="
      display: inline-block;
      padding: 15px 25px;
      background-color: #0284c7;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
    "
  >
    Reset Password
  </a>
</div>
        <p style="color: #374151; font-size: 14px; margin-bottom: 10px;">
          This link will expire in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} Idea-Investor Matcher. All rights reserved.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: '🔑 Reset Your Password - Idea-Investor Matcher',
      html: htmlContent,
    });
  }
}
