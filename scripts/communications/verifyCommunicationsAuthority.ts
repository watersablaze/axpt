import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const EXPECTED_PERMISSIONS = [
  "COMMUNICATIONS_ACCESS",
  "COMMUNICATIONS_DIRECT_CREATE",
  "COMMUNICATIONS_GROUP_CREATE",
  "COMMUNICATIONS_MESSAGE_SEND",
  "COMMUNICATIONS_CONVERSATION_MANAGE",
] as const

type PermissionRow = {
  key: string
}

type RolePermissionRow = {
  permission: {
    key: string
  }
}

async function main() {
  const communicationsPermissions =
    await prisma.permission.findMany({
      where: {
        key: {
          in: [...EXPECTED_PERMISSIONS],
        },
      },
      orderBy: {
        key: "asc",
      },
    })

  const admin =
    await prisma.role.findUnique({
      where: {
        key: "ADMIN_PLATFORM",
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })

  if (!admin) {
    throw new Error(
      "COMMUNICATIONS_AUTHORITY_ADMIN_ROLE_NOT_FOUND"
    )
  }

  const actualPermissionKeys =
    (communicationsPermissions as PermissionRow[])
      .map((permission) => permission.key)
      .sort()

  const adminCommunicationPermissions =
    (admin.rolePermissions as RolePermissionRow[])
      .map((rolePermission) =>
        rolePermission.permission.key
      )
      .filter((key: string) =>
        key.startsWith("COMMUNICATIONS_")
      )
      .sort()

  const expectedPermissionKeys =
    [...EXPECTED_PERMISSIONS].sort()

  if (
    JSON.stringify(actualPermissionKeys) !==
    JSON.stringify(expectedPermissionKeys)
  ) {
    throw new Error(
      `COMMUNICATIONS_PERMISSION_SET_MISMATCH:${JSON.stringify(
        actualPermissionKeys
      )}`
    )
  }

  if (
    JSON.stringify(adminCommunicationPermissions) !==
    JSON.stringify(expectedPermissionKeys)
  ) {
    throw new Error(
      `COMMUNICATIONS_ADMIN_GRANT_MISMATCH:${JSON.stringify(
        adminCommunicationPermissions
      )}`
    )
  }

  console.log(
    "✓ Communications authority verification passed"
  )

  console.log({
    permissionCount:
      communicationsPermissions.length,

    permissions:
      actualPermissionKeys,

    adminRole:
      admin.key,

    adminCommunicationPermissions,
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
