import React from "react";

type SelectSize = "sm" | "md" | "lg";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: SelectSize;
  error?: boolean;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: "h-9 min-h-[44px] px-3 text-xs",
  md: "h-10 min-h-[44px] px-3 text-sm",
  lg: "h-11 min-h-[44px] px-3 text-sm",
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ selectSize = "md", error = false, className = "", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-colors dark:bg-surface-sunken ${sizeClasses[selectSize]} ${
          error
            ? "border-error focus:ring-error/50"
            : "border-border focus:ring-primary/50"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
