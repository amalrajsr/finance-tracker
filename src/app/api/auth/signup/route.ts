import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOtp, hashOtp, getOtpExpiryDate } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Delete unverified user and their tokens if re-registering
    if (existingUser && !existingUser.emailVerified) {
      await db.verificationToken.deleteMany({
        where: { email: normalizedEmail },
      });
      await db.user.delete({ where: { id: existingUser.id } });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        email: normalizedEmail,
        hashedPassword,
      },
    });

    // Generate and store OTP
    const otp = generateOtp();
    const hashedToken = await hashOtp(otp);

    await db.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        expiresAt: getOtpExpiryDate(),
      },
    });

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp);

    return NextResponse.json(
      { message: "Verification email sent", requiresVerification: true },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
