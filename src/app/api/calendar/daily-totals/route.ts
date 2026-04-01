import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? "", 10);
  const year = parseInt(searchParams.get("year") ?? "", 10);

  if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const rawData = await db.transaction.groupBy({
      by: ["type", "date"],
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const dayMap = new Map<string, { date: string; debits: string; credits: string }>();

    rawData.forEach((row) => {
      const dateStr = row.date.toISOString().substring(0, 10);
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { date: dateStr, debits: "0", credits: "0" });
      }
      const entry = dayMap.get(dateStr)!;
      const amount = row._sum.amount?.toString() || "0";
      const current = parseFloat(row.type === "debit" ? entry.debits : entry.credits);
      const added = parseFloat(amount);

      if (row.type === "debit") {
        entry.debits = (current + added).toFixed(2);
      } else {
        entry.credits = (current + added).toFixed(2);
      }
    });

    const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ days });
  } catch (err) {
    console.error("[GET /api/calendar/daily-totals] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
