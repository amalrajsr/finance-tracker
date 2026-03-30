import { db } from "@/lib/db";
import { extractMerchant } from "@/lib/categorization/merchantExtractor";

export async function getAnalyticsSummary(userId: string, monthsParam: number = 6) {
  const months = isNaN(monthsParam) || monthsParam <= 0 ? 6 : monthsParam;

  // Calculate the date boundary
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // 1. Monthly Trend & Income vs Expense (grouped by month and type)
  const monthlyDataRaw = await db.transaction.groupBy({
    by: ["type", "date"],
    where: { userId, date: { gte: startDate } },
    _sum: { amount: true },
  });

  // Aggregate by YYYY-MM
  const monthlyMap = new Map<string, { month: string; debits: string; credits: string }>();
  monthlyDataRaw.forEach((row) => {
    const monthStr = row.date.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(monthStr)) {
      monthlyMap.set(monthStr, { month: monthStr, debits: "0", credits: "0" });
    }
    const existing = monthlyMap.get(monthStr)!;
    const amtText = row._sum.amount?.toString() || "0";
    const amtVal = parseFloat(amtText);
    const existingVal = parseFloat(row.type === "debit" ? existing.debits : existing.credits);
    
    if (row.type === "debit") {
      existing.debits = (existingVal + amtVal).toFixed(2);
    } else {
      existing.credits = (existingVal + amtVal).toFixed(2);
    }
  });
  // Sort chronologically
  const monthlyTrend = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // 2. Category Breakdown (Debits only)
  const categoryDataRaw = await db.transaction.findMany({
    where: { userId, date: { gte: startDate }, type: "debit" },
    select: { amount: true, category: { select: { id: true, slug: true, name: true, colour: true, icon: true } } },
  });

  const catMap = new Map<string, { categoryId: string | null; slug: string; name: string; colour: string; icon: string; totalRaw: number }>();
  let totalDebits = 0;
  
  categoryDataRaw.forEach((row) => {
    const amt = parseFloat(row.amount.toString());
    totalDebits += amt;
    const key = row.category ? row.category.slug : "uncategorized";
    
    if (!catMap.has(key)) {
      catMap.set(key, {
        categoryId: row.category?.id || null,
        slug: row.category?.slug || "uncategorized",
        name: row.category?.name || "Uncategorized",
        colour: row.category?.colour || "#9CA3AF", // Gray fallback
        icon: row.category?.icon || "❓",
        totalRaw: 0,
      });
    }
    catMap.get(key)!.totalRaw += amt;
  });

  const categoryBreakdown = Array.from(catMap.values())
    .map(c => ({
      ...c,
      total: c.totalRaw.toFixed(2),
      percent: totalDebits > 0 ? (c.totalRaw / totalDebits) * 100 : 0
    }))
    .sort((a, b) => b.totalRaw - a.totalRaw)
    .map(({ totalRaw, ...rest }) => rest);

  // Actually, let's fetch debits WITH description for Top Merchants and Heatmap
  const debitsWithDesc = await db.transaction.findMany({
    where: { userId, date: { gte: startDate }, type: "debit" },
    select: { amount: true, description: true, date: true }
  });

  // 3. Top Merchants (Debits only)
  const merchantMap = new Map<string, { merchant: string; totalRaw: number; count: number }>();
  debitsWithDesc.forEach((row) => {
    const amt = parseFloat(row.amount.toString());
    const merchant = extractMerchant(row.description);
    
    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, { merchant, totalRaw: 0, count: 0 });
    }
    const entry = merchantMap.get(merchant)!;
    entry.totalRaw += amt;
    entry.count += 1;
  });

  const topMerchants = Array.from(merchantMap.values())
    .sort((a, b) => b.totalRaw - a.totalRaw)
    .slice(0, 10)
    .map(m => ({ merchant: m.merchant, total: m.totalRaw.toFixed(2), count: m.count }));

  // 4. Daily Heatmap (Debits only)
  const heatMapRaw = new Map<string, number>();
  debitsWithDesc.forEach((row) => {
    const dateStr = row.date.toISOString().split('T')[0]; // YYYY-MM-DD
    const amt = parseFloat(row.amount.toString());
    heatMapRaw.set(dateStr, (heatMapRaw.get(dateStr) || 0) + amt);
  });

  const dailyHeatmap = Array.from(heatMapRaw.entries())
    .map(([date, totalRaw]) => ({ date, total: totalRaw.toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    monthlyTrend,
    categoryBreakdown,
    topMerchants,
    dailyHeatmap
  };
}
