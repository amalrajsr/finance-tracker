import type {
  BankParser,
  ParsedTransaction,
  ParserError,
  ParserResult,
} from "../types";

/**
 * Federal Bank statement parser.
 *
 * Bank name in the PDF is often an image; detection uses column headers and/or
 * footer text (e.g. federalbank.co.in).
 *
 * Columns:
 * Date | Value Date | Particulars | Tran Type | Tran ID | Cheque Details |
 * Withdrawals | Deposits | Balance | DR/CR
 *
 * Date format: DD-MMM-YYYY (e.g. 22-FEB-2026)
 * Amounts: optional Indian grouping (1,234.56) or plain 1234.56
 */
export const federalParser: BankParser = {
  bankName: "Federal Bank",

  detect(textLines: string[]): boolean {
    const joined = textLines.join(" ").toLowerCase();
    if (
      joined.includes("federalbank.co.in") ||
      joined.includes("the federal bank")
    ) {
      return true;
    }
    // Header fingerprint (works when footer is on another page / not yet joined)
    const hasParticulars = joined.includes("particulars");
    const hasTranType = joined.includes("tran type");
    const hasTranId = joined.includes("tran id");
    const hasDrCr = joined.includes("dr/cr");
    if (
      hasParticulars &&
      hasTranType &&
      hasTranId &&
      hasDrCr &&
      joined.includes("withdrawals") &&
      joined.includes("deposits")
    ) {
      return true;
    }
    // Fallback: column combo if header splits "DR/CR" across text items oddly
    if (
      hasParticulars &&
      hasTranType &&
      hasTranId &&
      joined.includes("withdrawals") &&
      joined.includes("deposits") &&
      joined.includes("balance")
    ) {
      return true;
    }
    return false;
  },

  parse(textLines: string[]): ParserResult {
    const transactions: ParsedTransaction[] = [];
    const errors: ParserError[] = [];

    const headerIndex = findHeaderRow(textLines);
    if (headerIndex === -1) {
      return {
        success: false,
        bank: "Federal Bank",
        statementPeriod: null,
        accountNumber: null,
        transactions: [],
        errors: [
          {
            line: 0,
            raw: "",
            reason:
              "Could not find Federal Bank transaction table header (Date / Particulars / Withdrawals / Deposits).",
          },
        ],
      };
    }

    const headerSlice = textLines.slice(0, headerIndex);
    const accountNumber = extractAccountNumber(headerSlice);
    const statementPeriod =
      extractStatementPeriod(headerSlice) ??
      extractStatementPeriodFromAllLines(textLines);

    // Extract opening balance for first-transaction type inference
    const openingBalance = extractOpeningBalance(
      textLines.slice(headerIndex, headerIndex + 5),
    );

    let pendingParticulars: string | null = null;
    let lastTransaction: ParsedTransaction | null = null;

    for (let i = headerIndex + 1; i < textLines.length; i++) {
      const line = textLines[i].trim();
      if (!line || isFooterLine(line)) continue;

      if (isStatementEnd(line)) break;

      const parsed = parseTransactionLine(line);

      if (parsed) {
        if (pendingParticulars && lastTransaction) {
          lastTransaction.description =
            `${lastTransaction.description} ${pendingParticulars}`.trim();
          pendingParticulars = null;
        }
        transactions.push(parsed);
        lastTransaction = parsed;
      } else if (lastTransaction && isContinuationLine(line)) {
        if (pendingParticulars) {
          pendingParticulars += ` ${line}`;
        } else {
          pendingParticulars = line;
        }
      } else if (line.length > 5 && !isIgnorableRow(line)) {
        errors.push({
          line: i,
          raw: line,
          reason: "Could not parse as Federal Bank transaction row",
        });
      }
    }

    if (pendingParticulars && lastTransaction) {
      lastTransaction.description =
        `${lastTransaction.description} ${pendingParticulars}`.trim();
    }

    // Determine transaction type by comparing consecutive closing balances
    for (let i = 0; i < transactions.length; i++) {
      const prevBalance =
        i === 0 ? openingBalance : transactions[i - 1].balance;
      if (prevBalance !== null) {
        transactions[i].type =
          transactions[i].balance < prevBalance ? "debit" : "credit";
      } else {
        transactions[i].type = inferTypeFromDescription(
          transactions[i].description,
        );
      }
    }

    return {
      success: transactions.length > 0,
      bank: "Federal Bank",
      statementPeriod,
      accountNumber,
      transactions,
      errors,
    };
  },
};

const FEDERAL_DATE_PREFIX =
  /^(\d{1,2}-[A-Z]{3}-\d{4})\s+(\d{1,2}-[A-Z]{3}-\d{4})\s+/i;

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/** Matches decimal amounts like 1,234.56 or 150.00 */
const AMOUNT_TOKEN = /[\d,]+\.\d{2}/g;

function findHeaderRow(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (
      lower.includes("date") &&
      lower.includes("particulars") &&
      lower.includes("withdrawals") &&
      lower.includes("deposits") &&
      lower.includes("balance") &&
      (lower.includes("tran type") || lower.includes("tran id"))
    ) {
      return i;
    }
  }
  return -1;
}

function parseFederalDate(dateStr: string): string | null {
  const m = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return null;
  const mon = MONTHS[m[2].toLowerCase()];
  if (!mon) return null;
  const day = parseInt(m[1], 10);
  const year = parseInt(m[3], 10);
  if (Number.isNaN(day) || Number.isNaN(year) || day < 1 || day > 31) {
    return null;
  }
  return `${year}-${mon}-${String(day).padStart(2, "0")}`;
}

function parseIndianAmount(s: string): number {
  return parseFloat(s.replace(/,/g, ""));
}

function parseTransactionLine(line: string): ParsedTransaction | null {
  const dm = line.match(FEDERAL_DATE_PREFIX);
  if (!dm) return null;

  const isoDate = parseFederalDate(dm[1]);
  if (!isoDate) return null;

  const afterDates = line.slice(dm[0].length);

  // pdfjs omits the empty withdrawal/deposit cell, so only 2 amounts appear:
  // transaction amount + closing balance, followed by Cr/Dr (balance sign)
  const tailMatch = afterDates.match(
    /\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+(Cr|Dr)\s*$/i,
  );
  if (!tailMatch) return null;

  const amount = parseIndianAmount(tailMatch[1]);
  const balance = parseIndianAmount(tailMatch[2]);

  const middle = afterDates
    .slice(0, afterDates.length - tailMatch[0].length)
    .trim();

  const refMatch = middle.match(/\b(S\d+)\b/i);
  const referenceNumber = refMatch ? refMatch[1].toUpperCase() : "";

  return {
    date: isoDate,
    description: cleanDescription(middle),
    referenceNumber,
    amount,
    type: "debit", // placeholder — corrected in post-processing via balance comparison
    balance,
  };
}

/** e.g. "Opening Balance 2905.21 Cr" */
function extractOpeningBalance(linesNearHeader: string[]): number | null {
  for (const line of linesNearHeader) {
    const m = line.match(/opening\s+balance\s+([\d,]+\.\d{2})/i);
    if (m) return parseIndianAmount(m[1]);
  }
  return null;
}

function inferTypeFromDescription(description: string): "debit" | "credit" {
  const lower = description.toLowerCase();
  if (
    lower.includes("upi in") ||
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

function cleanDescription(desc: string): string {
  return desc.replace(/\s+/g, " ").trim();
}

function isContinuationLine(line: string): boolean {
  if (FEDERAL_DATE_PREFIX.test(line)) return false;
  const matches = line.match(AMOUNT_TOKEN);
  if (matches && matches.length >= 2) return false;
  return true;
}

function isIgnorableRow(line: string): boolean {
  const lower = line.toLowerCase().trim();
  return (
    lower.includes("opening balance") ||
    lower.includes("closing balance") ||
    lower.startsWith("total") ||
    lower === "type details /cr" ||
    lower === "type details" ||
    lower === "/cr" ||
    /^type\s+details/i.test(lower)
  );
}

function isFooterLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("the federal bank ltd") ||
    lower.includes("federalbank.co.in") ||
    lower.includes("federal towers") ||
    /page\s+\d+\s+of\s+\d+/i.test(line) ||
    lower.includes("abbreviations used") ||
    lower.includes("disclaimer") ||
    lower.includes("this is a computer generated")
  );
}

function isStatementEnd(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("grand total") ||
    lower.includes("abbreviations used:") ||
    lower.includes("end of statement")
  );
}

function extractAccountNumber(headerLines: string[]): string | null {
  for (const line of headerLines) {
    const m = line.match(
      /(?:a\/c|account|acct)\s*(?:no|number)?[.:]*\s*([\d*Xx]{4,})/i,
    );
    if (m) {
      const raw = m[1].replace(/\s/g, "");
      const digits = raw.replace(/\D/g, "");
      if (digits.length >= 4) {
        return `XXXX${digits.slice(-4)}`;
      }
    }
  }
  return null;
}

function extractStatementPeriod(
  headerLines: string[],
): { from: string; to: string } | null {
  const joined = headerLines.join(" ");
  return matchStatementPeriodRange(joined);
}

function extractStatementPeriodFromAllLines(
  lines: string[],
): { from: string; to: string } | null {
  const joined = lines.join(" ");
  return matchStatementPeriodRange(joined);
}

/** e.g. Statement of Account for the period 2026-02-22 to 2026-03-02 */
function matchStatementPeriodRange(
  text: string,
): { from: string; to: string } | null {
  const m = text.match(
    /period\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i,
  );
  if (m) {
    return { from: m[1], to: m[2] };
  }
  return null;
}
