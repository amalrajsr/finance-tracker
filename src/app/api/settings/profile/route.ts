import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  name: z.union([
    z
      .string()
      .max(50, "Name must be at most 50 characters")
      .trim()
      .transform((s) => (s === "" ? null : s)),
    z.null(),
  ]),
});

type ProfileRow = {
  name: string | null;
  email: string;
  createdAt: Date;
};

async function selectProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const rows = await db.$queryRaw<ProfileRow[]>`
    SELECT "name", "email", "createdAt"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await selectProfileByUserId(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[settings/profile GET]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load profile";
    const dbHint =
      message.includes("column") && message.includes("name")
        ? " Run: npx prisma db push (or migrate) to add the name column."
        : "";
    return NextResponse.json(
      { error: `${message}${dbHint}` },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name } = parsed.data;

    await db.$executeRaw`
      UPDATE "User"
      SET "name" = ${name}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${session.user.id}
    `;

    const updated = await selectProfileByUserId(session.user.id);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: updated.name,
      email: updated.email,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[settings/profile PATCH]", err);
    const message =
      err instanceof Error ? err.message : "Failed to update profile";
    const dbHint =
      message.includes("column") && message.includes("name")
        ? " Run: npx prisma db push (or migrate) to add the name column."
        : "";
    return NextResponse.json(
      { error: `${message}${dbHint}` },
      { status: 500 },
    );
  }
}
