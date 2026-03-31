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
        className={`w-full rounded-lg border bg-surface text-text-primary focus:outline-none transition-[border-color,box-shadow] duration-150 dark:bg-surface-sunken ${sizeClasses[selectSize]} ${
          error
            ? "border-error focus:border-error focus:ring-[3px] focus:ring-error/15"
            : "border-border-light focus:border-border-strong focus:ring-[3px] focus:ring-focus-ring"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
