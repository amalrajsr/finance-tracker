import bcrypt from "bcryptjs";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const BCRYPT_ROUNDS = 12;

export function generateOtp(): string {
  const max = Math.pow(10, OTP_LENGTH);
  const min = Math.pow(10, OTP_LENGTH - 1);
  const otp = crypto.randomInt(min, max);
  return otp.toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
}

export async function verifyOtp(
  otp: string,
  hashedOtp: string
): Promise<boolean> {
  return bcrypt.compare(otp, hashedOtp);
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}
