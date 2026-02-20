/** A single parsed transaction from a bank statement */
export interface ParsedTransaction {
  /** ISO 8601 date (YYYY-MM-DD) */
  date: string;
  /** Cleaned narration/description */
  description: string;
  /** Cheque or reference number */
  referenceNumber: string;
  /** Always positive amount */
  amount: number;
  /** Whether money was withdrawn or deposited */
  type: "debit" | "credit";
  /** Closing balance after this transaction */
  balance: number;
}

/** Result returned by a bank parser */
export interface ParserResult {
  success: boolean;
  /** Bank identifier (e.g. "HDFC") */
  bank: string;
  /** Statement period */
  statementPeriod: { from: string; to: string } | null;
  /** Last 4 digits of account number (privacy) */
  accountNumber: string | null;
  /** Successfully parsed transactions */
  transactions: ParsedTransaction[];
  /** Rows that could not be parsed */
  errors: ParserError[];
}

/** A row that failed to parse */
export interface ParserError {
  /** Approximate line number in extracted text */
  line: number;
  /** Raw text that failed */
  raw: string;
  /** Why it failed */
  reason: string;
}

/** Interface every bank parser must implement */
export interface BankParser {
  /** Bank identifier (e.g. "HDFC") */
  bankName: string;
  /** Check if extracted text belongs to this bank */
  detect(textLines: string[]): boolean;
  /** Parse text lines into transactions */
  parse(textLines: string[]): ParserResult;
}

/** Stages of the parsing pipeline */
export type ParsingStage =
  | "idle"
  | "reading"
  | "decrypting"
  | "extracting"
  | "parsing"
  | "done"
  | "error";

/** Progress state for the UI */
export interface ParsingProgress {
  stage: ParsingStage;
  message: string;
  /** 0-100 */
  percent: number;
}
