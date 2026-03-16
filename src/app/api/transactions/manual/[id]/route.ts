import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionFormSchema } from "@/app/dashboard/transactions/_utils/transaction-form.schema";
import crypto from "crypto";
import { z } from "zod";

const patchSchema = transactionFormSchema.partial();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Transaction not found" }, { status: 404 });
    }
    if (transaction.userId !== userId || !transaction.isManual) {
      return NextResponse.json({ code: "FORBIDDEN", message: "Cannot edit this transaction" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid fields", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check dedup collision if critical fields are updated
    if (data.date || data.amount !== undefined || data.type || data.description) {
      const newDate = data.date ? new Date(data.date).toISOString() : transaction.date.toISOString();
      const newAmount = data.amount !== undefined ? data.amount : transaction.amount.toNumber();
      const newType = data.type || transaction.type;
      const newDesc = data.description || transaction.description;

      const rawHashString = `${userId}-${newDate}-${newAmount}-${newType}-${newDesc}`;
      const newDedupHash = crypto.createHash("sha256").update(rawHashString).digest("hex");

      if (newDedupHash !== transaction.dedupHash) {
        const existing = await db.transaction.findUnique({ where: { dedupHash: newDedupHash } });
        if (existing) {
          return NextResponse.json(
            { code: "DUPLICATE_TRANSACTION", message: "A similar transaction already exists." },
            { status: 409 }
          );
        }
        await db.transaction.update({
          where: { id },
          data: {
            dedupHash: newDedupHash,
            ...(data.date ? { date: new Date(data.date) } : {}),
            ...(data.amount !== undefined ? { amount: data.amount } : {}),
            ...(data.type ? { type: data.type } : {}),
            ...(data.description ? { description: data.description } : {}),
            ...(data.categoryId !== undefined ? { categoryId: data.categoryId, manualCategory: !!data.categoryId } : {}),
          },
        });
      } else {
         if (data.categoryId !== undefined) {
             await db.transaction.update({
                 where: { id },
                 data: { categoryId: data.categoryId, manualCategory: !!data.categoryId }
             });
         }
      }
    } else if (data.categoryId !== undefined) {
        await db.transaction.update({
            where: { id },
            data: { categoryId: data.categoryId, manualCategory: !!data.categoryId }
        });
    }

    const updated = await db.transaction.findUnique({ where: { id } });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/transactions/manual/[id] error:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Transaction not found" }, { status: 404 });
    }
    if (transaction.userId !== userId || !transaction.isManual) {
      return NextResponse.json({ code: "FORBIDDEN", message: "Cannot delete this transaction" }, { status: 403 });
    }

    await db.transaction.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/transactions/manual/[id] error:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to delete transaction" }, { status: 500 });
  }
}
