import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, otp, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const token = await db.verificationToken.findFirst({
      where: { email: normalizedEmail, type: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 },
      );
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const isValid = await verifyOtp(otp, token.token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { email: normalizedEmail },
        data: { hashedPassword },
      }),
      db.verificationToken.deleteMany({
        where: { email: normalizedEmail, type: "PASSWORD_RESET" },
      }),
    ]);

    return NextResponse.json(
      { message: "Password reset successfully", reset: true },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
