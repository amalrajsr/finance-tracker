"use client";

import { useCallback, useState, useRef } from "react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (file.type !== "application/pdf") {
        setError("Please select a PDF file.");
        return;
      }

      const maxSize = 4 * 1024 * 1024; // 4MB
      if (file.size > maxSize) {
        setError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 4MB. Please download a shorter-range statement.`,
        );
        return;
      }

      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [disabled, validateAndSelect],
  );

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [validateAndSelect],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-primary bg-primary-light scale-[1.01]"
              : disabled
                ? "border-border bg-background cursor-not-allowed opacity-60"
                : "border-border hover:border-primary/50 hover:bg-primary-light/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDragging ? "bg-primary/20" : "bg-primary-light"
            }`}
          >
            <svg
              className={`w-6 h-6 transition-colors ${
                isDragging ? "text-primary" : "text-primary/70"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
        </div>

        <p className="text-sm font-medium text-text-primary mb-1">
          {isDragging ? "Drop your PDF here" : "Drop your bank statement here"}
        </p>
        <p className="text-xs text-text-muted">
          or click to browse • PDF only • Max 4MB
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-debit flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
