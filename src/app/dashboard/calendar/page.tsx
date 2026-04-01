import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarView } from "./_components/calendar-view";

export default async function CalendarPage() {
  await auth();

  const categories = await db.category.findMany({
    select: { id: true, slug: true, name: true, colour: true, icon: true },
    orderBy: { name: "asc" },
  });

  return <CalendarView categories={categories} />;
}
