import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorize, UserRule } from "@/lib/categorization/engine";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const transactionInputSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  referenceNumber: z.string(),
  amount: z.number().positive(),
  type: z.enum(["debit", "credit"]),
  balance: z.number(),
});

const postBodySchema = z.object({
  bank: z.string().min(1),
  statementPeriod: z.object({ from: z.string(), to: z.string() }).nullable(),
  transactions: z.array(transactionInputSchema).min(1),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDedupHash(
  userId: string,
  date: string,
  amount: number,
  type: string,
  balance: number,
): string {
  return createHash("sha256")
    .update(`${userId}:${date}:${amount}:${type}:${balance}`)
    .digest("hex");
}

// ---------------------------------------------------------------------------
// POST /api/transactions — bulk insert with dedup
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { bank, statementPeriod, transactions } = parsed.data;

  // Fetch user categories and system categories mapping
  const [userRulesData, categoriesData] = await Promise.all([
    db.userCategoryRule.findMany({ where: { userId }, select: { keyword: true, categoryId: true } }),
    db.category.findMany({ select: { slug: true, id: true } })
  ]);
  
  const userRules: UserRule[] = userRulesData;
  const slugToIdMap = new Map(categoriesData.map((c) => [c.slug, c.id]));

  // Compute dedup hash and categorization for every incoming transaction
  const withHashesAndCategories = transactions.map((t) => {
    const categoryId = categorize(t.description, userRules, slugToIdMap);
    return {
      ...t,
      hash: computeDedupHash(userId, t.date, t.amount, t.type, t.balance),
      categoryId,
    };
  });

  // Find which hashes already exist in the DB for this user
  const incomingHashes = withHashesAndCategories.map((t) => t.hash);
  const existing = await db.transaction.findMany({
    where: { userId, dedupHash: { in: incomingHashes } },
    select: { dedupHash: true },
  });
  const existingHashSet = new Set(existing.map((e) => e.dedupHash));

  const toInsert = withHashesAndCategories.filter((t) => !existingHashSet.has(t.hash));
  const skipped = withHashesAndCategories.length - toInsert.length;

  try {
    const statementId = await db.$transaction(async (tx) => {
      const statement = await tx.statement.create({
        data: {
          userId,
          bank,
          fromDate: statementPeriod?.from
            ? new Date(statementPeriod.from)
            : null,
          toDate: statementPeriod?.to ? new Date(statementPeriod.to) : null,
          txnCount: toInsert.length,
        },
      });

      if (toInsert.length > 0) {
        await tx.transaction.createMany({
          data: toInsert.map((t) => ({
            userId,
            statementId: statement.id,
            date: new Date(t.date),
            description: t.description,
            reference: t.referenceNumber,
            amount: t.amount,
            type: t.type as "debit" | "credit",
            balance: t.balance,
            dedupHash: t.hash,
            categoryId: t.categoryId,
            manualCategory: false,
          })),
          // Safety net for race conditions — unique constraint handles it at DB level
          skipDuplicates: true,
        });
      }

      return statement.id;
    });

    return NextResponse.json({ inserted: toInsert.length, skipped, statementId });
  } catch (err) {
    console.error("[POST /api/transactions] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/transactions — paginated list with filters
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const typeParam = searchParams.get("type");
  const search = searchParams.get("search")?.trim();
  const categoryParam = searchParams.get("category");

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(typeParam === "debit" || typeParam === "credit"
      ? { type: typeParam }
      : {}),
    ...(search
      ? { description: { contains: search, mode: "insensitive" } }
      : {}),
    ...(categoryParam 
      ? categoryParam === "uncategorized" 
        ? { categoryId: null } 
        : { category: { slug: categoryParam } }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        date: true,
        description: true,
        reference: true,
        amount: true,
        type: true,
        balance: true,
        createdAt: true,
        categoryId: true,
        manualCategory: true,
        isManual: true,
        category: {
          select: {
            slug: true,
            name: true,
            colour: true,
            icon: true,
          }
        }
      },
    }),
    db.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      reference: t.reference,
      amount: t.amount.toString(),
      type: t.type,
      balance: t.balance.toString(),
      manualCategory: t.manualCategory,
      isManual: t.isManual,
      categorySlug: t.category?.slug,
      categoryName: t.category?.name,
      categoryColour: t.category?.colour,
      categoryIcon: t.category?.icon,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
