import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const token = await db.verificationToken.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { error: "No pending verification for this email" },
        { status: 400 },
      );
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const isValid = await verifyOtp(otp, token.token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    // Mark user as verified and clean up tokens
    await db.$transaction([
      db.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.deleteMany({
        where: { email: normalizedEmail },
      }),
    ]);

    return NextResponse.json(
      { message: "Email verified successfully", verified: true },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
