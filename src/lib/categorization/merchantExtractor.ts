/**
 * Extracts a probable merchant name from common Indian banking narration patterns (specifically HDFC).
 * Examples:
 *   - "UPI-SWIGGY-swiggy@axl-HDFC-..." -> "SWIGGY"
 *   - "NEFT-RENT PAYMENT-JOHN DOE-..." -> "RENT PAYMENT"
 *   - "BIL/ONL/000012345/Jio Prepaid" -> "Jio Prepaid"
 * 
 * Used entirely for Analytics (Top Merchants chart), no persistence.
 */
export function extractMerchant(description: string): string {
  if (!description) return "Unknown";

  const upperDesc = description.toUpperCase();

  // UPI Transactions: UPI-<MERCHANT>-<VPA>-...
  if (upperDesc.startsWith("UPI-")) {
    const parts = description.split("-");
    if (parts.length >= 2) {
      return titleCase(parts[1].trim());
    }
  }

  // NEFT/RTGS Transactions: NEFT-<PURPOSE>-<BENEFICIARY>-...
  if (upperDesc.startsWith("NEFT-") || upperDesc.startsWith("RTGS-")) {
    const parts = description.split("-");
    if (parts.length >= 3) {
      return titleCase(parts[2].trim()); // Usually beneficiary is the 3rd part
    }
  }

  // Billdesk/Online payments: BIL/ONL/12345/MerchantName
  if (upperDesc.startsWith("BIL/") || upperDesc.startsWith("ONL/")) {
    const parts = description.split("/");
    if (parts.length >= 4) {
      return titleCase(parts[parts.length - 1].trim());
    }
  }

  // POS/Card transactions: POS XXXXXX MERCHANTNAME
  if (upperDesc.startsWith("POS ")) {
    const parts = description.split(" ");
    if (parts.length >= 3) {
      return titleCase(parts.slice(2).join(" ").trim());
    }
  }

  // Default fallback: Take the first 30 characters
  return titleCase(description.substring(0, 30).trim());
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
