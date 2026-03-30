import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const monthsParam = parseInt(searchParams.get("months") ?? "6", 10);

  try {
    const summary = await getAnalyticsSummary(userId, monthsParam);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[GET /api/analytics/summary] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
