import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorize, UserRule } from "@/lib/categorization/engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Find all uncategorized transactions where manualCategory is false
    const uncategorized = await db.transaction.findMany({
      where: {
        userId,
        categoryId: null,
        manualCategory: false,
      },
      select: { id: true, description: true },
    });

    if (uncategorized.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Load user rules and system categories
    const [userRulesData, categoriesData] = await Promise.all([
      db.userCategoryRule.findMany({
        where: { userId },
        select: { keyword: true, categoryId: true },
      }),
      db.category.findMany({ select: { slug: true, id: true } }),
    ]);

    const userRules: UserRule[] = userRulesData;
    const slugToIdMap = new Map(categoriesData.map((c) => [c.slug, c.id]));

    let updatedCount = 0;
    
    // Batch update since Prisma doesn't support complex CASE WHEN in updateMany
    // We'll process them in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < uncategorized.length; i += chunkSize) {
      const chunk = uncategorized.slice(i, i + chunkSize);
      
      await db.$transaction(async (tx) => {
        for (const txn of chunk) {
          const newCategoryId = categorize(txn.description, userRules, slugToIdMap);
          if (newCategoryId) {
            await tx.transaction.update({
              where: { id: txn.id },
              data: { categoryId: newCategoryId },
            });
            updatedCount++;
          }
        }
      });
    }

    return NextResponse.json({ updated: updatedCount });
  } catch (err) {
    console.error("[POST /api/transactions/backfill] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
