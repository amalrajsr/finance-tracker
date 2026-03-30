"use client";

import { useState, useCallback } from "react";
import { DropZone } from "./_components/DropZone";
import { PasswordInput } from "./_components/PasswordInput";
import { ParsingProgress } from "./_components/ParsingProgress";
import { TransactionPreview } from "./_components/TransactionPreview";
import { extractTextFromPDF, PDFExtractionError } from "@/lib/pdf/extractor";
import { parseTransactions } from "@/lib/pdf/parser-registry";
import { Button } from "@/components/ui/button";
import type {
  ParsedTransaction,
  ParserResult,
  ParsingProgress as ProgressType,
} from "@/lib/pdf/types";

type UploadStep = "upload" | "parsing" | "preview" | "success";

export default function UploadPage() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState<ProgressType>({
    stage: "idle",
    message: "",
    percent: 0,
  });
  const [parserResult, setParserResult] = useState<ParserResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // No auto-redirect: let the user choose when to navigate

  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  }, []);

  const handleParse = useCallback(async () => {
    if (!file) return;

    setStep("parsing");
    setError(null);

    try {
      // Extract text from PDF
      const textLines = await extractTextFromPDF(file, password, setProgress);
      // Parse transactions
      setProgress({
        stage: "parsing",
        message: "Identifying bank and parsing transactions...",
        percent: 85,
      });

      const result = parseTransactions(textLines);

      setProgress({
        stage: "done",
        message: `Found ${result.transactions.length} transactions`,
        percent: 100,
      });

      setParserResult(result);

      if (result.success && result.transactions.length > 0) {
        // Short delay to show completion before transitioning
        setTimeout(() => setStep("preview"), 600);
      } else {
        setError(
          result.errors[0]?.reason ||
            "No transactions found in this statement.",
        );
        setStep("upload");
      }
    } catch (err) {
      const message =
        err instanceof PDFExtractionError
          ? err.message
          : "An unexpected error occurred while parsing the PDF.";
      setError(message);
      setProgress({
        stage: "error",
        message,
        percent: 0,
      });
      setStep("upload");
    }
  }, [file, password]);

  const handleConfirm = useCallback(
    async (selected: ParsedTransaction[]) => {
      if (!parserResult) return;
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank: parserResult.bank,
            statementPeriod: parserResult.statementPeriod,
            transactions: selected.map((t) => ({
              date: t.date,
              description: t.description,
              referenceNumber: t.referenceNumber,
              amount: t.amount,
              type: t.type,
              balance: t.balance,
            })),
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Failed to save transactions.");
        }

        const data = (await res.json()) as {
          inserted: number;
          skipped: number;
        };
        setSavedCount(data.inserted);
        setSkippedCount(data.skipped);
        setStep("success");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to save transactions. Please try again.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [parserResult],
  );

  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPassword("");
    setProgress({ stage: "idle", message: "", percent: 0 });
    setParserResult(null);
    setError(null);
    setIsSubmitting(false);
    setSavedCount(0);
  }, []);

  const steps = [
    { key: "upload", label: "Select File" },
    { key: "parsing", label: "Parse" },
    { key: "preview", label: "Review" },
    { key: "success", label: "Done" },
  ] as const;

  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Upload Statement
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Parse your bank statement PDF to extract transactions
        </p>
      </div>

      {/* Step indicator */}
      <nav aria-label="Upload progress" className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-initial">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  i < currentIdx
                    ? "bg-primary text-white"
                    : i === currentIdx
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-background text-text-muted border border-border"
                }`}
              >
                {i < currentIdx ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:inline whitespace-nowrap ${
                i <= currentIdx ? "text-text-primary" : "text-text-muted"
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${
                i < currentIdx ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </nav>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-5">
          <DropZone onFileSelected={handleFileSelected} />

          {file && (
            <div className="space-y-4">
              {/* Selected file badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-text-muted hover:text-error transition-colors cursor-pointer p-2.5 rounded-lg"
                  aria-label="Remove file"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <PasswordInput value={password} onChange={setPassword} />

              <Button
                onClick={handleParse}
                size="lg"
                className="w-full"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                }
              >
                Parse Statement
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-debit/10 border border-debit/20 text-sm text-debit">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step: Parsing */}
      {step === "parsing" && <ParsingProgress progress={progress} />}

      {/* Step: Preview */}
      {step === "preview" && parserResult && (
        <div className="space-y-4">
          {/* Bank info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="px-2 py-1 rounded bg-primary-light text-primary font-medium">
              {parserResult.bank}
            </span>
            {parserResult.accountNumber && (
              <span>Account: {parserResult.accountNumber}</span>
            )}
            {parserResult.statementPeriod && (
              <span>
                {parserResult.statementPeriod.from} →{" "}
                {parserResult.statementPeriod.to}
              </span>
            )}
          </div>

          <TransactionPreview
            transactions={parserResult.transactions}
            errorCount={parserResult.errors.length}
            onConfirm={handleConfirm}
            onCancel={handleReset}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-credit/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-credit"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Transactions saved!
          </h2>
          <p className="text-sm text-text-secondary mb-1">
            <span className="font-semibold text-text-primary">
              {savedCount}
            </span>{" "}
            transaction{savedCount !== 1 ? "s" : ""} added.
            {skippedCount > 0 && (
              <>
                {" "}
                <span className="text-text-muted">
                  ({skippedCount} skipped as duplicates)
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-text-muted mb-6">
            Choose where to go next
          </p>
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="secondary" size="md">
              Upload Another
            </Button>
            <a
              href="/dashboard/transactions"
              className="h-10 min-h-[44px] px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center cursor-pointer"
            >
              View Transactions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
