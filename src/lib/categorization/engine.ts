import { systemRules } from "./rules";

export interface UserRule {
  categoryId: string;
  keyword: string;
}

/**
 * Categorizes a transaction description using user rules first, then system rules.
 * 
 * @param description The raw transaction narration from the bank statement
 * @param userRules An array of UserCategoryRule objects fetched from the database
 * @param categorySlugToIdMap A map of category slugs to their respective IDs
 * @returns { categoryId: string | null }
 */
export function categorize(
  description: string,
  userRules: UserRule[],
  categorySlugToIdMap: Map<string, string>
): string | null {
  if (!description) return null;
  const lowerDesc = description.toLowerCase();

  // 1. User Rules (Highest Priority)
  // Find the first matching user rule where the description contains the keyword
  const matchedUserRule = userRules.find((rule) =>
    lowerDesc.includes(rule.keyword.toLowerCase())
  );

  if (matchedUserRule) {
    return matchedUserRule.categoryId;
  }

  // 2. System Rules
  // Loop through predefined system categories and their keywords
  for (const [slug, keywords] of Object.entries(systemRules)) {
    const isMatch = keywords.some((keyword) =>
      lowerDesc.includes(keyword.toLowerCase())
    );

    if (isMatch) {
      return categorySlugToIdMap.get(slug) || null;
    }
  }

  // 3. Fallback to Null (Uncategorized)
  return null;
}
