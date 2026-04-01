"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} className="size-12 text-lg font-semibold" />
        <InputOTPSlot index={1} className="size-12 text-lg font-semibold" />
        <InputOTPSlot index={2} className="size-12 text-lg font-semibold" />
        <InputOTPSlot index={3} className="size-12 text-lg font-semibold" />
        <InputOTPSlot index={4} className="size-12 text-lg font-semibold" />
        <InputOTPSlot index={5} className="size-12 text-lg font-semibold" />
      </InputOTPGroup>
    </InputOTP>
  );
}
