// System rules for categorization
// Matches are tested case-insensitively using simple substring matching.
// Order matters within this object (keys checked sequentially if structured as an array, though engine will evaluate all).

export const systemRules: Record<string, string[]> = {
  // 1. Food & Dining
  "food-dining": [
    "swiggy",
    "zomato",
    "kfc",
    "mcdonalds",
    "dominos",
    "starbucks",
    "cafe",
    "restaurant",
    "bakery",
    "sweet",
    "pizzahut",
    "subway",
    "ubereats",
    "foodpanda",
  ],

  // 2. Groceries
  groceries: [
    "zepto",
    "blinkit",
    "instamart",
    "bigbasket",
    "dmart",
    "spencer",
    "more retail",
    "reliance fresh",
    "supermarket",
    "grocery",
    "dairy",
    "amul",
  ],

  // 3. Transport
  transport: [
    "uber",
    "ola",
    "rapido",
    "irctc",
    "makemytrip",
    "goibibo",
    "flight",
    "indigo",
    "airindia",
    "vistara",
    "petrol",
    "diesel",
    "fuel",
    "hpcl",
    "bpcl",
    "iocl",
    "indian oil",
    "bharat petroleum",
    "navayuga",
    "fastag",
    "toll",
    "metro",
  ],

  // 4. Shopping
  shopping: [
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "meesho",
    "nykaa",
    "reliance trends",
    "lifestyle",
    "zara",
    "h&m",
    "shoppers stop",
    "pantaloons",
    "croma",
    "reliance digital",
    "apparel",
    "garments",
    "clothing",
    "footwear",
  ],

  // 5. Bills & Utilities
  "bills-utilities": [
    "jio",
    "airtel",
    "vi",
    "vodafone",
    "bsnl",
    "recharge",
    "electricity",
    "bescom",
    "tscpdcl",
    "tssdcl",
    "water bd",
    "gas",
    "indane",
    "hp gas",
    "bharat gas",
    "bill desk",
    "broadband",
    "act fibernet",
    "hathway",
    "excitel",
    "tatasky",
    "dth",
    "bescom",
  ],

  // 6. Health
  health: [
    "apollo",
    "pharmacy",
    "medplus",
    "netmeds",
    "pharmeasy",
    "hospital",
    "clinic",
    "diagnostics",
    "pathlab",
    "dr lal",
    "practo",
    "tata 1mg",
    "1mg",
    "health",
    "fitness",
    "gym",
    "cult.fit",
  ],

  // 7. Entertainment
  entertainment: [
    "netflix",
    "amazon prime",
    "hotstar",
    "spotify",
    "apple",
    "youtube",
    "bookmyshow",
    "pvr",
    "inox",
    "cinepolis",
    "playstation",
    "steam",
    "multiplex",
    "cinema",
  ],

  // 8. Education
  education: [
    "school",
    "college",
    "university",
    "institute",
    "tuition",
    "udemy",
    "coursera",
    "byjus",
    "unacademy",
    "fee",
    "education",
  ],

  // 9. Transfers
  transfers: [
    "gpay",
    "paytm",
    "phonepe",
    "cred",
    "mobikwik",
    "freecharge",
    "neft",
    "rtgs",
    "imps",
    "upi", // NOTE: "upi" is very broad; the engine must run user rules first
    "transfer",
  ],

  // 10. EMI & Loans
  "emi-loans": [
    "emi",
    "loan",
    "bajaj finserv",
    "muthoot",
    "hdfc bank loan",
    "sbi card",
    "credit card bill",
  ],

  // 11. Cash Withdrawal
  "cash-withdrawal": [
    "atm",
    "cash wdl",
    "cash withdrawal",
    "atw",
  ],

  // 12. Salary & Income
  "salary-income": [
    "salary",
    "sal",
    "payroll",
    "bonus",
    "dividend",
    "interest",
    "refund",
    "cashback",
  ],
};
