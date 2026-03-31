import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring-strong disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-primary-hover text-text-on-primary",
        secondary:
          "border border-border bg-surface hover:bg-background text-text-secondary dark:hover:bg-surface-sunken",
        ghost:
          "text-text-secondary hover:bg-muted hover:text-text-primary dark:hover:bg-surface-sunken",
        danger: "bg-error hover:bg-error/90 text-white",
      },
      size: {
        sm: "h-9 min-h-[44px] min-w-[44px] px-3 text-xs",
        md: "h-10 min-h-[44px] min-w-[44px] px-4 text-sm",
        lg: "h-11 min-h-[44px] min-w-[44px] px-6 text-sm",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const spinner = (
  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? spinner : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
