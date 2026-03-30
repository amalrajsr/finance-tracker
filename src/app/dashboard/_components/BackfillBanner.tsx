"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function BackfillBanner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [result, setResult] = useState<{ updated: number } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleBackfill = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/transactions/backfill", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setIsDone(true);
        router.refresh();
      } else {
        toast("Failed to run backfill: " + data.error, "error");
      }
    } catch (err) {
      console.error(err);
      toast("Network error. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isDone) {
    if (result && result.updated === 0) {
      return null;
    }

    return (
      <div className="bg-success-light border border-success/20 text-success p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-success/10 p-1.5 rounded-full">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Categorization Complete</h3>
            <p className="text-xs mt-0.5 opacity-90">Successfully categorized {result?.updated} past transactions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-light border border-primary/15 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
      <div className="flex items-start gap-3 relative z-10">
        <div className="bg-primary/10 p-2 rounded-lg shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">New Categorization Engine Available</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
            We've upgraded our system to automatically categorize your transactions. Run the categorization engine to apply these rules to your past uncategorized transactions.
          </p>
        </div>
      </div>

      <button
        onClick={handleBackfill}
        disabled={isProcessing}
        className="w-full sm:w-auto relative z-10 shrink-0 inline-flex items-center justify-center gap-2 h-10 min-h-[44px] px-5 bg-primary hover:bg-primary-hover disabled:opacity-70 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          "Run Auto-Categorization"
        )}
      </button>
    </div>
  );
}
