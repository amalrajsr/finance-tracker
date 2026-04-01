import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOtp, hashOtp, getOtpExpiryDate } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";

const COOLDOWN_SECONDS = 45;

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    // Always return same response to prevent email enumeration
    const successResponse = NextResponse.json(
      { message: "If an account exists, a reset code has been sent" },
      { status: 200 },
    );

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Don't send reset email for non-existent or unverified users
    if (!user || !user.emailVerified) {
      return successResponse;
    }

    // Check cooldown on last PASSWORD_RESET token
    const lastToken = await db.verificationToken.findFirst({
      where: { email: normalizedEmail, type: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
    });

    if (lastToken) {
      const elapsed = (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return NextResponse.json(
          { error: "Please wait before requesting another code", retryAfter },
          { status: 429 },
        );
      }
    }

    // Delete old PASSWORD_RESET tokens and create new one
    await db.verificationToken.deleteMany({
      where: { email: normalizedEmail, type: "PASSWORD_RESET" },
    });

    const otp = generateOtp();
    const hashedToken = await hashOtp(otp);

    await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        type: "PASSWORD_RESET",
        expiresAt: getOtpExpiryDate(),
      },
    });

    await sendPasswordResetEmail(normalizedEmail, otp);

    return successResponse;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
