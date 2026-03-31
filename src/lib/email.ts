import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_PROVIDER_KEY);

const FROM_EMAIL = "FinTrack <onboarding@resend.dev>";

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "FinTrack — Verify your email",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1B1510;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">FinTrack</h1>
        <p style="font-size: 14px; color: #74685E; margin: 0 0 32px;">Privacy-first expense tracking</p>

        <p style="font-size: 16px; margin: 0 0 24px;">Enter this code to verify your email address:</p>

        <div style="background: #F6F3ED; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1B1510;">${otp}</span>
        </div>

        <p style="font-size: 14px; color: #74685E; margin: 0 0 8px;">This code expires in 5 minutes.</p>
        <p style="font-size: 14px; color: #9A8E84; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
