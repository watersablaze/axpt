import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const user =
    await prisma.user.findUnique({
      where: {
        email:
          "communications.operator@axpt.local",
      },

      select: {
        id: true,
        email: true,
        tier: true,
        displayName: true,

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
    })

  console.log(
    JSON.stringify(
      user,
      null,
      2
    )
  )
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
