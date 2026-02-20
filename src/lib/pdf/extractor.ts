"use client";

import * as pdfjsLib from "pdfjs-dist";
import type { ParsingProgress } from "./types";

// Set the worker source to the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_PAGES = 30;

/**
 * Extract text lines from a PDF file, optionally decrypting with a password.
 * Runs entirely in the browser — the file never leaves the client.
 */
export async function extractTextFromPDF(
  file: File,
  password: string,
  onProgress: (progress: ParsingProgress) => void,
): Promise<string[]> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new PDFExtractionError(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 4MB limit. Please download a shorter-range statement from your bank.`,
    );
  }

  // Read file into ArrayBuffer
  onProgress({ stage: "reading", message: "Reading file...", percent: 5 });
  const arrayBuffer = await file.arrayBuffer();

  // Load PDF document
  onProgress({
    stage: "decrypting",
    message: "Decrypting PDF...",
    percent: 15,
  });

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      password: password || undefined,
    });
    pdfDoc = await loadingTask.promise;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Incorrect Password")) {
        throw new PDFExtractionError(
          "Incorrect password. Please check and try again.",
        );
      }
      if (error.message.includes("Invalid PDF")) {
        throw new PDFExtractionError(
          "This file doesn't appear to be a valid PDF.",
        );
      }
    }
    throw new PDFExtractionError(
      "Failed to open PDF. The file may be corrupted or use unsupported encryption.",
    );
  }

  // Validate page count
  if (pdfDoc.numPages > MAX_PAGES) {
    pdfDoc.destroy();
    throw new PDFExtractionError(
      `This statement has ${pdfDoc.numPages} pages (max ${MAX_PAGES}). Please download a shorter-range statement (e.g. 3 months) from your bank.`,
    );
  }

  // Extract text from each page
  onProgress({
    stage: "extracting",
    message: "Extracting text from pages...",
    percent: 30,
  });

  const allLines: string[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    // Group text items into lines based on Y position
    const lineMap = new Map<number, string[]>();
    for (const item of textContent.items) {
      if ("str" in item && item.str.trim()) {
        // Round Y to group items on the same line
        const y =
          Math.round(("transform" in item ? item.transform[5] : 0) * 10) / 10;
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y)!.push(item.str);
      }
    }

    // Sort by Y (descending, since PDF Y goes bottom-up) and join
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const line = lineMap.get(y)!.join(" ").trim();
      if (line) {
        allLines.push(line);
      }
    }

    const progressPercent = 30 + Math.round((i / pdfDoc.numPages) * 50);
    onProgress({
      stage: "extracting",
      message: `Extracting page ${i} of ${pdfDoc.numPages}...`,
      percent: progressPercent,
    });
  }

  pdfDoc.destroy();
  return allLines;
}

/** Custom error for PDF extraction failures */
export class PDFExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PDFExtractionError";
  }
}
