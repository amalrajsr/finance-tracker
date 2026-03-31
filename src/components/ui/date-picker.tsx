"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange?: (value: string) => void;
  id?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
  error = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const handleSelect = React.useCallback(
    (day: Date | undefined) => {
      if (day) {
        onChange?.(format(day, "yyyy-MM-dd"));
      }
      setOpen(false);
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-10 min-h-[44px] w-full items-center justify-between rounded-lg border bg-surface px-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-sunken",
          error
            ? "border-error focus:border-error focus:ring-1 focus:ring-error/20"
            : "border-border-light focus:border-border-strong focus:ring-1 focus:ring-border-strong/25",
          !dateValue && "text-text-muted",
          dateValue && "text-text-primary",
          className,
        )}
      >
        <span>{dateValue ? format(dateValue, "dd MMM yyyy") : placeholder}</span>
        <CalendarIcon className="size-4 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 bg-surface dark:bg-surface-raised"
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          defaultMonth={dateValue}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
