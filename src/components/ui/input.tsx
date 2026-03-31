import * as React from "react";
import { cn } from "@/lib/utils";

type InputSize = "sm" | "md" | "lg";

const sizeClasses: Record<InputSize, string> = {
  sm: "h-9 min-h-[44px] px-3 text-xs",
  md: "h-10 min-h-[44px] px-3 text-sm",
  lg: "h-11 min-h-[44px] px-3 text-sm",
};

interface InputProps extends React.ComponentProps<"input"> {
  inputSize?: InputSize;
  error?: boolean;
  errorId?: string;
}

function Input({
  className,
  type,
  inputSize = "md",
  error = false,
  errorId,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={error || undefined}
      aria-describedby={errorId || undefined}
      className={cn(
        "w-full rounded-lg border bg-surface text-text-primary placeholder:text-text-muted outline-none transition-[border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-sunken",
        sizeClasses[inputSize],
        error
          ? "border-error focus:border-error focus:ring-1 focus:ring-error/20"
          : "border-border-light focus:border-border-strong focus:ring-1 focus:ring-border-strong/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
