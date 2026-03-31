import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOtp, hashOtp, getOtpExpiryDate } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const COOLDOWN_SECONDS = 45;

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json(
        { error: "No pending verification for this email" },
        { status: 400 },
      );
    }

    // Check cooldown — last token must be older than COOLDOWN_SECONDS
    const lastToken = await db.verificationToken.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (lastToken) {
      const elapsed = (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return NextResponse.json(
          { error: "Please wait before requesting a new code", retryAfter },
          { status: 429 },
        );
      }
    }

    // Delete old tokens and create new one
    await db.verificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const otp = generateOtp();
    const hashedToken = await hashOtp(otp);

    await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        expiresAt: getOtpExpiryDate(),
      },
    });

    await sendOtpEmail(normalizedEmail, otp);

    return NextResponse.json(
      { message: "Verification code sent", sent: true },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
