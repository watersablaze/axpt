import { prisma } from "@/lib/prisma"

async function main() {
  await prisma.operator.createMany({
    data: [
      {
        id: "bobby",
        name: "Bobby",
        archetype: "EXECUTOR",
        isActive: true,
      },
      {
        id: "jamal",
        name: "Jamal",
        archetype: "ANALYST",
        isActive: true,
      },
      {
        id: "lawrence",
        name: "Lawrence",
        archetype: "GUARDIAN",
        isActive: true,
      },
    ],
  })
}

main().finally(() => prisma.$disconnect())