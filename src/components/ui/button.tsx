import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 min-h-[44px] min-w-[44px] px-3 text-xs",
  md: "h-10 min-h-[44px] min-w-[44px] px-4 text-sm",
  lg: "h-11 min-h-[44px] min-w-[44px] px-6 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary hover:bg-primary-hover text-text-on-primary font-medium",
  secondary:
    "border border-border bg-surface hover:bg-background text-text-secondary font-medium dark:hover:bg-surface-sunken",
  ghost:
    "text-text-secondary hover:bg-background hover:text-text-primary font-medium dark:hover:bg-surface-sunken",
  danger:
    "bg-error hover:bg-error/90 text-white font-medium",
};

const spinner = (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? spinner : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
