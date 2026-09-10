import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users =
    await prisma.user.findMany({
      select: {
        email: true,
        tier: true,
        isAdmin: true,

        userRoles: {
          where: {
            isActive: true,
            revokedAt: null,
          },

          select: {
            role: {
              select: {
                key: true,
              },
            },
          },
        },
      },

      orderBy: {
        email: "asc",
      },
    })

  console.log(
    JSON.stringify(
      users,
      null,
      2
    )
  )
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
