const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SENDER_NAME,
        email: process.env.SENDER_EMAIL,
      },
      to: [{ email }],
      subject: "FinTrack — Verify your email",
      htmlContent: `
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${body}`);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  otp: string
): Promise<void> {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SENDER_NAME,
        email: process.env.SENDER_EMAIL,
      },
      to: [{ email }],
      subject: "FinTrack — Reset your password",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1B1510;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">FinTrack</h1>
          <p style="font-size: 14px; color: #74685E; margin: 0 0 32px;">Privacy-first expense tracking</p>

          <p style="font-size: 16px; margin: 0 0 24px;">Use this code to reset your password:</p>

          <div style="background: #F6F3ED; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1B1510;">${otp}</span>
          </div>

          <p style="font-size: 14px; color: #74685E; margin: 0 0 8px;">This code expires in 5 minutes.</p>
          <p style="font-size: 14px; color: #9A8E84; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${body}`);
  }
}
