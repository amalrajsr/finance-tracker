import * as React from "react";
import { cn } from "@/lib/utils";

type SelectSize = "sm" | "md" | "lg";

const sizeClasses: Record<SelectSize, string> = {
  sm: "h-9 min-h-[44px] px-3 text-xs",
  md: "h-10 min-h-[44px] px-3 text-sm",
  lg: "h-11 min-h-[44px] px-3 text-sm",
};

interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: SelectSize;
  error?: boolean;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ selectSize = "md", error = false, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-surface text-text-primary outline-none transition-[border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-sunken",
          sizeClasses[selectSize],
          error
            ? "border-error focus:border-error focus:ring-1 focus:ring-error/20"
            : "border-border-light focus:border-border-strong focus:ring-1 focus:ring-border-strong/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
