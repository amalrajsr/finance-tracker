import type {
  BankParser,
  ParsedTransaction,
  ParserError,
  ParserResult,
} from "../types";

/**
 * HDFC Bank statement parser.
 *
 * Handles savings account statements with columns:
 * Date | Narration | Chq./Ref No. | Value Dt | Withdrawal Amt. | Deposit Amt. | Closing Balance
 *
 * Date format: DD/MM/YY
 * Amount format: Indian notation (1,00,000.00) or plain (1000.00)
 */
export const hdfcParser: BankParser = {
  bankName: "HDFC",

  detect(textLines: string[]): boolean {
    const joined = textLines.slice(0, 30).join(" ").toLowerCase();
    return (
      joined.includes("hdfc bank") ||
      (joined.includes("narration") &&
        joined.includes("withdrawal") &&
        joined.includes("deposit") &&
        joined.includes("closing balance"))
    );
  },

  parse(textLines: string[]): ParserResult {
    const transactions: ParsedTransaction[] = [];
    const errors: ParserError[] = [];

    // Find the header row
    const headerIndex = findHeaderRow(textLines);
    if (headerIndex === -1) {
      return {
        success: false,
        bank: "HDFC",
        statementPeriod: null,
        accountNumber: null,
        transactions: [],
        errors: [
          {
            line: 0,
            raw: "",
            reason:
              "Could not find transaction table header. This may not be an HDFC savings account statement.",
          },
        ],
      };
    }

    // Extract account number and statement period from header area
    const accountNumber = extractAccountNumber(textLines.slice(0, headerIndex));
    const statementPeriod = extractStatementPeriod(
      textLines.slice(0, headerIndex),
    );

    // Parse transaction rows
    let pendingNarration: string | null = null;
    let lastTransaction: ParsedTransaction | null = null;

    for (let i = headerIndex + 1; i < textLines.length; i++) {
      const line = textLines[i].trim();

      // Skip empty lines and footer-like content
      if (!line || isFooterLine(line)) continue;

      // Try to parse as a transaction row
      const parsed = parseTransactionLine(line);

      if (parsed) {
        // If we had a pending multi-line narration, attach it
        if (pendingNarration && lastTransaction) {
          lastTransaction.description += " " + pendingNarration;
          pendingNarration = null;
        }

        transactions.push(parsed);
        lastTransaction = parsed;
      } else if (lastTransaction && isContinuationLine(line)) {
        // Multi-line narration: line has no date prefix, append to last transaction
        if (pendingNarration) {
          pendingNarration += " " + line;
        } else {
          pendingNarration = line;
        }
      } else if (isStatementEnd(line)) {
        // End of transactions section
        break;
      } else if (line.length > 5) {
        // Genuinely unparseable row
        errors.push({
          line: i,
          raw: line,
          reason: "Could not parse as transaction row",
        });
      }
    }

    // Attach any remaining pending narration
    if (pendingNarration && lastTransaction) {
      lastTransaction.description += " " + pendingNarration;
    }

    // Determine transaction type by comparing consecutive closing balances
    for (let i = 0; i < transactions.length; i++) {
      if (i === 0) {
        // First transaction: no previous balance to compare, use keyword fallback
        transactions[i].type = inferTypeFromDescription(
          transactions[i].description,
        );
      } else {
        const prevBalance = transactions[i - 1].balance;
        const currBalance = transactions[i].balance;
        transactions[i].type = currBalance < prevBalance ? "debit" : "credit";
      }
    }

    return {
      success: transactions.length > 0,
      bank: "HDFC",
      statementPeriod,
      accountNumber,
      transactions,
      errors,
    };
  },
};

// ── Helper functions ─────────────────────────────────────────────

/** Date pattern: DD/MM/YY or DD/MM/YYYY */
const DATE_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4})/;

/** Indian number format: 1,00,000.00 or plain 1000.00 */
const AMOUNT_REGEX = /[\d,]+\.\d{2}/g;

function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (
      lower.includes("date") &&
      lower.includes("narration") &&
      (lower.includes("withdrawal") || lower.includes("debit")) &&
      (lower.includes("deposit") || lower.includes("credit"))
    ) {
      return i;
    }
  }
  return -1;
}

function parseTransactionLine(line: string): ParsedTransaction | null {
  const dateMatch = line.match(DATE_REGEX);
  if (!dateMatch) return null;

  const dateStr = dateMatch[1];
  const isoDate = convertToISO(dateStr);
  if (!isoDate) return null;

  // Extract all amounts from the line
  const amounts = extractAmounts(line);
  if (amounts.length < 1) return null;

  // Extract reference number (usually a sequence of digits)
  const refMatch = line.match(/\b(\d{9,})\b/);
  const referenceNumber = refMatch ? refMatch[1] : "";

  // Determine amount and balance
  // HDFC format: ... Withdrawal | Deposit | Closing Balance
  // The last amount is closing balance, the one before it is the transaction amount
  let amount: number;
  let balance: number;

  if (amounts.length >= 2) {
    balance = amounts[amounts.length - 1];
    amount = amounts[amounts.length - 2];
  } else {
    // Only one amount found — likely just the balance or a malformed row
    return null;
  }

  // Extract description (between date and first amount)
  const description = extractDescription(line, dateStr);

  return {
    date: isoDate,
    description: cleanDescription(description),
    referenceNumber,
    amount,
    type: "debit", // Placeholder — corrected in post-processing via balance comparison
    balance,
  };
}

function extractAmounts(line: string): number[] {
  const matches = line.match(AMOUNT_REGEX);
  if (!matches) return [];
  return matches.map((m) => parseIndianNumber(m));
}

function parseIndianNumber(str: string): number {
  return parseFloat(str.replace(/,/g, ""));
}

function convertToISO(dateStr: string): string | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  // Handle 2-digit year
  if (year < 100) {
    year += year > 50 ? 1900 : 2000;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferTypeFromDescription(description: string): "debit" | "credit" {
  const lower = description.toLowerCase();
  if (
    lower.includes("salary") ||
    lower.includes("credit") ||
    lower.includes("interest") ||
    lower.includes("refund") ||
    lower.includes("cashback")
  ) {
    return "credit";
  }
  return "debit";
}

function extractDescription(line: string, dateStr: string): string {
  // Remove the date from the beginning
  let desc = line.substring(line.indexOf(dateStr) + dateStr.length).trim();

  // Remove amounts from the end
  const amounts = desc.match(AMOUNT_REGEX);
  if (amounts) {
    // Find the position of the first amount and take everything before it
    const firstAmountIdx = desc.search(AMOUNT_REGEX);
    if (firstAmountIdx > 0) {
      desc = desc.substring(0, firstAmountIdx).trim();
    }
  }

  return desc;
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/^\s*[-/]\s*/, "") // Remove leading separators
    .trim();
}

function isContinuationLine(line: string): boolean {
  // A continuation line has no date at the start and no amounts
  return !DATE_REGEX.test(line) && !AMOUNT_REGEX.test(line);
}

function isFooterLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("statement summary") ||
    lower.includes("page ") ||
    lower.includes("disclaimer") ||
    lower.includes("this is a computer generated") ||
    lower.includes("opening balance") ||
    lower.includes("unless the constituent")
  );
}

function isStatementEnd(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("statement summary") ||
    lower.includes("end of statement") ||
    lower.includes("closing balance as on")
  );
}

function extractAccountNumber(headerLines: string[]): string | null {
  for (const line of headerLines) {
    // Look for account number patterns
    const match = line.match(
      /(?:a\/c|account|acct)\s*(?:no|number)?[.:]*\s*(\d{4,})/i,
    );
    if (match) {
      // Return only last 4 digits for privacy
      const full = match[1];
      return "XXXX" + full.slice(-4);
    }
  }
  return null;
}

function extractStatementPeriod(
  headerLines: string[],
): { from: string; to: string } | null {
  const joined = headerLines.join(" ");
  // Look for date range patterns like "01/04/2024 to 30/06/2024"
  const rangeMatch = joined.match(
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|-)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  );
  if (rangeMatch) {
    const from = convertToISO(rangeMatch[1]);
    const to = convertToISO(rangeMatch[2]);
    if (from && to) return { from, to };
  }
  return null;
}
