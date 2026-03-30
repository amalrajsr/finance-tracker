import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  categoryId: z.string().cuid(),
  saveAsRule: z.object({ keyword: z.string().min(1) }).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { categoryId, saveAsRule } = parsed.data;

  try {
    // Verify ownership
    const transaction = await db.transaction.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (transaction.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify category exists
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: { categoryId, manualCategory: true },
      });

      if (saveAsRule?.keyword) {
        // Normalize keyword
        const keyword = saveAsRule.keyword.trim().toLowerCase();
        
        // Upsert user rule
        await tx.userCategoryRule.upsert({
          where: {
            userId_keyword: {
              userId,
              keyword,
            },
          },
          update: {
            categoryId,
          },
          create: {
            userId,
            keyword,
            categoryId,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/transactions/${id}] DB error:`, err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
