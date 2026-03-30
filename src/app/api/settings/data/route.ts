import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  await db.$transaction([
    db.transaction.deleteMany({ where: { userId } }),
    db.statement.deleteMany({ where: { userId } }),
    db.userCategoryRule.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ message: "All data cleared successfully" });
}
