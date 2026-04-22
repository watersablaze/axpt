import { prisma } from "@/lib/prisma"

async function seedOperators() {
  await prisma.operator.createMany({
    data: [
      { name: "Ma’ya", archetype: "EXECUTOR" },
      { name: "Guardian Node", archetype: "GUARDIAN" },
      { name: "Analyst Node", archetype: "ANALYST" },
      { name: "Diplomat Node", archetype: "DIPLOMAT" },
    ],
    skipDuplicates: true,
  })

  console.log("✅ Operators seeded")
}

seedOperators()
  .catch(console.error)
  .finally(() => process.exit())