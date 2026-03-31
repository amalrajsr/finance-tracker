import React from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: boolean;
  errorId?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "h-9 min-h-[44px] px-3 text-xs",
  md: "h-10 min-h-[44px] px-3 text-sm",
  lg: "h-11 min-h-[44px] px-3 text-sm",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = "md", error = false, errorId, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={error || undefined}
        aria-describedby={errorId || undefined}
        className={`w-full rounded-lg border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none transition-[border-color,box-shadow] duration-150 dark:bg-surface-sunken ${sizeClasses[inputSize]} ${
          error
            ? "border-error focus:border-error focus:ring-[3px] focus:ring-error/15"
            : "border-border-light focus:border-border-strong focus:ring-[3px] focus:ring-focus-ring"
        } ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
