import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users =
    await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            isActive: true,
            revokedAt: null,
            role: {
              rolePermissions: {
                some: {
                  permission: {
                    key: "COMMUNICATIONS_ACCESS",
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        email: true,
        displayName: true,
        name: true,

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
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
