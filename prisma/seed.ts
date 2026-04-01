import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  {
    slug: "food-dining",
    name: "Food & Dining",
    icon: "🍽️",
    colour: "#F97316",
    sortOrder: 1,
  },
  {
    slug: "groceries",
    name: "Groceries",
    icon: "🛒",
    colour: "#22C55E",
    sortOrder: 2,
  },
  {
    slug: "transport",
    name: "Transport",
    icon: "🚗",
    colour: "#3B82F6",
    sortOrder: 3,
  },
  {
    slug: "shopping",
    name: "Shopping",
    icon: "🛍️",
    colour: "#EC4899",
    sortOrder: 4,
  },
  {
    slug: "bills-utilities",
    name: "Bills & Utilities",
    icon: "💡",
    colour: "#8B5CF6",
    sortOrder: 5,
  },
  {
    slug: "health",
    name: "Health",
    icon: "🏥",
    colour: "#EF4444",
    sortOrder: 6,
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    icon: "🎭",
    colour: "#D946EF",
    sortOrder: 7,
  },
  {
    slug: "education",
    name: "Education",
    icon: "📚",
    colour: "#0EA5E9",
    sortOrder: 8,
  },
  {
    slug: "transfers",
    name: "Transfers",
    icon: "🔄",
    colour: "#64748B",
    sortOrder: 9,
  },
  {
    slug: "emi-loans",
    name: "EMI & Loans",
    icon: "🏦",
    colour: "#EAB308",
    sortOrder: 10,
  },
  {
    slug: "cash-withdrawal",
    name: "Cash Withdrawal",
    icon: "🏧",
    colour: "#14B8A6",
    sortOrder: 11,
  },
  {
    slug: "salary-income",
    name: "Salary & Income",
    icon: "💰",
    colour: "#10B981",
    sortOrder: 12,
  },
  {
    slug: "investment",
    name: "Investment",
    icon: "📈",
    colour: "#6366F1",
    sortOrder: 13,
  },
  {
    slug: "fitness",
    name: "Fitness",
    icon: "🏋️‍♂️",
    colour: "#F43F5E",
    sortOrder: 14,
  },
  
  {
    slug: "other",
    name: "Other",
    icon: "📦",
    colour: "#94A3B8",
    sortOrder: 15,
  },
];

async function main() {
  console.log("Seeding default categories...");

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        colour: cat.colour,
        sortOrder: cat.sortOrder,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        colour: cat.colour,
        sortOrder: cat.sortOrder,
      },
    });
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
