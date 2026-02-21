import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  // Compute dedup hash for every incoming transaction
  const withHashes = transactions.map((t) => ({
    ...t,
    hash: computeDedupHash(userId, t.date, t.amount, t.type, t.balance),
  }));

  // Find which hashes already exist in the DB for this user
  const incomingHashes = withHashes.map((t) => t.hash);
  const existing = await db.transaction.findMany({
    where: { userId, dedupHash: { in: incomingHashes } },
    select: { dedupHash: true },
  });
  const existingHashSet = new Set(existing.map((e) => e.dedupHash));

  const toInsert = withHashes.filter((t) => !existingHashSet.has(t.hash));
  const skipped = withHashes.length - toInsert.length;

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
      },
    }),
    db.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
      balance: t.balance.toString(),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
