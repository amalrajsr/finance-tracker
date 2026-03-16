import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionFormSchema } from "@/app/dashboard/transactions/_utils/transaction-form.schema";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = transactionFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid fields", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const rawHashString = `${userId}-${data.date}-${data.amount}-${data.type}-${data.description}`;
    const dedupHash = crypto.createHash("sha256").update(rawHashString).digest("hex");

    const existing = await db.transaction.findUnique({
      where: { dedupHash },
    });

    if (existing) {
      return NextResponse.json(
        { code: "DUPLICATE_TRANSACTION", message: "A similar transaction already exists." },
        { status: 409 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        userId,
        // Since no statement is associated with manual transactions
        date: new Date(data.date),
        description: data.description,
        amount: data.amount,
        type: data.type,
        balance: 0, // Default to 0, not calculated dynamically for manual txns yet
        dedupHash,
        categoryId: data.categoryId || null,
        isManual: true,
        manualCategory: !!data.categoryId,
      },
      select: {
        id: true,
        amount: true,
        date: true,
        type: true,
        description: true,
        categoryId: true,
        isManual: true,
        createdAt: true,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions/manual error:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to create transaction" }, { status: 500 });
  }
}
