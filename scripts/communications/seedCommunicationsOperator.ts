import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ROLE_KEY =
  "COMMUNICATIONS_OPERATOR"

const EMAIL =
  "communications.operator@axpt.local"

async function main() {
  const permissionKeys = [
    "ADMIN_SURFACE_ACCESS",
    "COMMUNICATIONS_ACCESS",
    "COMMUNICATIONS_DIRECT_CREATE",
    "COMMUNICATIONS_MESSAGE_SEND",
    "COMMUNICATIONS_CONVERSATION_MANAGE",
  ]

  const permissions =
    await prisma.permission.findMany({
      where: {
        key: {
          in: permissionKeys,
        },
      },
    })

  if (
    permissions.length !==
    permissionKeys.length
  ) {
    throw new Error(
      "COMMUNICATIONS_OPERATOR_PERMISSIONS_INCOMPLETE"
    )
  }

  const role =
    await prisma.role.upsert({
      where: {
        key:
          ROLE_KEY,
      },

      update: {
        label:
          "Communications Operator",

        description:
          "Authorized AXPT internal communications participant.",
      },

      create: {
        key:
          ROLE_KEY,

        label:
          "Communications Operator",

        description:
          "Authorized AXPT internal communications participant.",

        isSystem:
          false,
      },
    })

  for (
    const permission of permissions
  ) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId:
            role.id,

          permissionId:
            permission.id,
        },
      },

      update: {},

      create: {
        roleId:
          role.id,

        permissionId:
          permission.id,
      },
    })
  }

  const user =
    await prisma.user.upsert({
      where: {
        email:
          EMAIL,
      },

      update: {
        displayName:
          "Communications Operator",

        name:
          "Communications Operator",
      },

      create: {
        username:
          "communications_operator",

        email:
          EMAIL,

        passwordHash:
          "DEV_COMMUNICATIONS_OPERATOR_ONLY",

        displayName:
          "Communications Operator",

        name:
          "Communications Operator",

        viewedDocs:
          [],
      },
    })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId:
          user.id,

        roleId:
          role.id,
      },
    },

    update: {
      isActive:
        true,

      revokedAt:
        null,
    },

    create: {
      userId:
        user.id,

      roleId:
        role.id,

      isActive:
        true,
    },
  })

  console.log(
    "✓ Communications operator established"
  )

  console.log({
    userId:
      user.id,

    email:
      user.email,

    role:
      role.key,

    permissions:
      permissionKeys,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
