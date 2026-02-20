import type { BankParser, ParserResult } from "./types";
import { hdfcParser } from "./banks/hdfc";

/** Registry of all available bank parsers */
const parsers: BankParser[] = [hdfcParser];

/**
 * Auto-detect bank from extracted text and parse transactions.
 * Tries each registered parser's detect() method.
 */
export function parseTransactions(textLines: string[]): ParserResult {
  for (const parser of parsers) {
    if (parser.detect(textLines)) {
      return parser.parse(textLines);
    }
  }

  return {
    success: false,
    bank: "Unknown",
    statementPeriod: null,
    accountNumber: null,
    transactions: [],
    errors: [
      {
        line: 0,
        raw: "",
        reason:
          "Could not detect the bank from this statement. Currently supported: HDFC savings account.",
      },
    ],
  };
}

/**
 * Register a new bank parser at runtime.
 * Useful for future bank support extensions.
 */
export function registerParser(parser: BankParser): void {
  parsers.push(parser);
}

/** Get list of supported bank names */
export function getSupportedBanks(): string[] {
  return parsers.map((p) => p.bankName);
}
