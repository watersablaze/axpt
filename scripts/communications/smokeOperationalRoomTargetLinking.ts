import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes"

import { archiveConversationWithClient } from "../../src/domains/communications/conversations/archiveConversationWithClient"
import { linkOperationalRoomTargetWithClient } from "../../src/domains/communications/operational-links/linkOperationalRoomTargetWithClient"
import { createOperationalRoomWithClient } from "../../src/domains/communications/operational-rooms/createOperationalRoomWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma =
  new PrismaClient()

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const nonce =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  const client =
    prisma as unknown as CommunicationsDatabaseClient

  const createdUserIds: string[] = []

  let conversationId:
    | string
    | null =
    null

  let roomId:
    | string
    | null =
    null

  let caseId:
    | string
    | null =
    null

  let archivedCaseId:
    | string
    | null =
    null

  let opportunityId:
    | string
    | null =
    null

  let dossierId:
    | string
    | null =
    null

  let transactionId:
    | string
    | null =
    null

  let treasuryAggregateId:
    | string
    | null =
    null

  try {
    /*
     * Resolve an existing role granting
     * COMMUNICATIONS_ACCESS for the room member.
     */
    const communicationsRole =
      await prisma.role.findFirst({
        where: {
          rolePermissions: {
            some: {
              permission: {
                key:
                  PERMISSIONS.COMMUNICATIONS_ACCESS,
              },
            },
          },
        },

        select: {
          id:
            true,
        },
      })

    assert(
      communicationsRole !== null,
      "COMMUNICATIONS_ACCESS_ROLE_NOT_FOUND"
    )

    const owner =
      await prisma.user.create({
        data: {
          username:
            `operational-link-owner-${nonce}`,

          email:
            `operational-link-owner-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    const member =
      await prisma.user.create({
        data: {
          username:
            `operational-link-member-${nonce}`,

          email:
            `operational-link-member-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    const outsider =
      await prisma.user.create({
        data: {
          username:
            `operational-link-outsider-${nonce}`,

          email:
            `operational-link-outsider-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    createdUserIds.push(
      owner.id,
      member.id,
      outsider.id
    )

    await prisma.userRole.create({
      data: {
        userId:
          member.id,

        roleId:
          communicationsRole.id,

        isActive:
          true,
      },
    })

    const ownerPrincipal: Principal = {
      userId:
        owner.id,

      email:
        owner.email,

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    }

    const memberWithoutManagePrincipal: Principal = {
      userId:
        member.id,

      email:
        member.email,

      roles:
        [],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
      ],
    }

    const outsiderPrincipal: Principal = {
      userId:
        outsider.id,

      email:
        outsider.email,

      roles:
        [],

      /*
       * Deliberately has manage permission.
       * Membership must still block access.
       */
      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    }

    /*
     * Establish one canonical Operational Room.
     */
    const createdRoom =
      await createOperationalRoomWithClient({
        client,

        principal:
          ownerPrincipal,

        clientRoomId:
          `operational-link-room-${nonce}`,

        title:
          `Operational Link Smoke ${nonce}`,

        roomClass:
          "GENERAL_OPERATIONS",

        memberUserIds: [
          member.id,
        ],
      })

    conversationId =
      createdRoom.conversation.id

    roomId =
      createdRoom.room.id

    /*
     * Minimal institutional target fixtures.
     */
    const caseRecord =
      await prisma.case.create({
        data: {
          title:
            `Operational Link Case ${nonce}`,
        },
      })

    caseId =
      caseRecord.id

    const archiveBlockedCase =
      await prisma.case.create({
        data: {
          title:
            `Archived Link Case ${nonce}`,
        },
      })

    archivedCaseId =
      archiveBlockedCase.id

    const opportunity =
      await prisma.opportunity.create({
        data: {
          title:
            `Operational Link Opportunity ${nonce}`,
        },
      })

    opportunityId =
      opportunity.id

    const dossier =
      await prisma.transactionDossier.create({
        data: {
          reference:
            `OP-LINK-${nonce}`,

          title:
            `Operational Link Dossier ${nonce}`,
        },
      })

    dossierId =
      dossier.id

    const wallet =
      await prisma.wallet.create({
        data: {
          userId:
            owner.id,
        },
      })

    const transaction =
      await prisma.transaction.create({
        data: {
          userId:
            owner.id,

          walletId:
            wallet.id,

          type:
            "COMMUNICATIONS_SMOKE",

          amount:
            1,
        },
      })

    transactionId =
      transaction.id

    treasuryAggregateId =
      `operational-link-treasury-${nonce}`

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId:
          treasuryAggregateId,

        version:
          1,

        status:
          "SMOKE",

        snapshot: {
          id:
            treasuryAggregateId,

          smoke:
            true,
        },
      },
    })

    /*
     * Snapshot target state before Communications
     * linking. Linking must not mutate the target.
     */
    const caseBefore =
      await prisma.case.findUniqueOrThrow({
        where: {
          id:
            caseRecord.id,
        },
      })

    /*
     * 1. Valid CASE link.
     */
    const caseLink =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          caseRecord.id,
      })

    assert(
      caseLink.targetType ===
        "CASE",
      "OPERATIONAL_LINK_CASE_TYPE_INVALID"
    )

    assert(
      caseLink.targetSubtype ===
        "CASE",
      "OPERATIONAL_LINK_CASE_SUBTYPE_INVALID"
    )

    /*
     * Target must remain untouched.
     */
    const caseAfter =
      await prisma.case.findUniqueOrThrow({
        where: {
          id:
            caseRecord.id,
        },
      })

    assert(
      JSON.stringify(caseBefore) ===
        JSON.stringify(caseAfter),
      "OPERATIONAL_LINK_MUTATED_CASE_TARGET"
    )

    /*
     * 2. Exact retry resolves existing link.
     */
    const caseRetry =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          caseRecord.id,
      })

    assert(
      caseRetry.id ===
        caseLink.id,
      "OPERATIONAL_LINK_EXACT_RETRY_CREATED_NEW_LINK"
    )

    const caseLinkCount =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId:
            createdRoom.room.id,

          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseRecord.id,
        },
      })

    assert(
      caseLinkCount ===
        1,
      "OPERATIONAL_LINK_EXACT_RETRY_DUPLICATED_ROW"
    )

    const caseLinkEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId:
            createdRoom.room.id,

          eventType:
            "COMMUNICATION_OPERATIONAL_TARGET_LINKED",
        },
      })

    /*
     * There will eventually be multiple target-link
     * events on the room stream. At this point only
     * the CASE link exists.
     */
    assert(
      caseLinkEventCount ===
        1,
      "OPERATIONAL_LINK_EXACT_RETRY_DUPLICATED_EVENT"
    )

    /*
     * 3. Concurrent natural-idempotency race.
     */
    const concurrentRequest = {
      client,

      principal:
        ownerPrincipal,

      roomId:
        createdRoom.room.id,

      targetType:
        "OPPORTUNITY",

      targetSubtype:
        "OPPORTUNITY",

      targetId:
        opportunity.id,
    }

    const [
      concurrentA,
      concurrentB,
    ] =
      await Promise.all([
        linkOperationalRoomTargetWithClient(
          concurrentRequest
        ),

        linkOperationalRoomTargetWithClient(
          concurrentRequest
        ),
      ])

    assert(
      concurrentA.id ===
        concurrentB.id,
      "OPERATIONAL_LINK_CONCURRENT_RETRY_DIVERGED"
    )

    const opportunityLinkCount =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId:
            createdRoom.room.id,

          targetType:
            "OPPORTUNITY",

          targetSubtype:
            "OPPORTUNITY",

          targetId:
            opportunity.id,
        },
      })

    assert(
      opportunityLinkCount ===
        1,
      "OPERATIONAL_LINK_CONCURRENT_DUPLICATE_PERSISTED"
    )

    /*
     * 4. Remaining canonical target families.
     */
    const dossierLink =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "TRANSACTION_DOSSIER",

        targetSubtype:
          "TRANSACTION_DOSSIER",

        targetId:
          dossier.id,
      })

    assert(
      dossierLink.targetId ===
        dossier.id,
      "OPERATIONAL_LINK_DOSSIER_FAILED"
    )

    const transactionLink =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "TRANSACTION",

        targetSubtype:
          "TRANSACTION",

        targetId:
          transaction.id,
      })

    assert(
      transactionLink.targetId ===
        transaction.id,
      "OPERATIONAL_LINK_TRANSACTION_FAILED"
    )

    const treasuryBefore =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId:
              treasuryAggregateId,
          },
        },
      })

    const treasuryLink =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "TREASURY_GATEWAY_AGGREGATE",

        targetSubtype:
          TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        targetId:
          treasuryAggregateId,
      })

    assert(
      treasuryLink.targetSubtype ===
        TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,
      "OPERATIONAL_LINK_TREASURY_FAILED"
    )

    const treasuryAfter =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId:
              treasuryAggregateId,
          },
        },
      })

    assert(
      JSON.stringify(treasuryBefore) ===
        JSON.stringify(treasuryAfter),
      "OPERATIONAL_LINK_MUTATED_TREASURY_TARGET"
    )

    /*
     * 5. Wrong fixed subtype blocked.
     */
    let subtypeMismatchBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "TRANSACTION",

        targetId:
          caseRecord.id,
      })
    } catch (error: unknown) {
      subtypeMismatchBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_MISMATCH"
    }

    assert(
      subtypeMismatchBlocked,
      "OPERATIONAL_LINK_SUBTYPE_MISMATCH_NOT_BLOCKED"
    )

    /*
     * 6. Missing institutional target blocked.
     */
    let missingTargetBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          `missing-case-${nonce}`,
      })
    } catch (error: unknown) {
      missingTargetBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
    }

    assert(
      missingTargetBlocked,
      "OPERATIONAL_LINK_MISSING_TARGET_NOT_BLOCKED"
    )

    /*
     * 7. Arbitrary Treasury subtype blocked before
     * persistence lookup.
     */
    let treasurySubtypeBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "TREASURY_GATEWAY_AGGREGATE",

        targetSubtype:
          "NOT_A_TREASURY_AGGREGATE",

        targetId:
          treasuryAggregateId,
      })
    } catch (error: unknown) {
      treasurySubtypeBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPE_INVALID"
    }

    assert(
      treasurySubtypeBlocked,
      "OPERATIONAL_LINK_ARBITRARY_TREASURY_SUBTYPE_NOT_BLOCKED"
    )

    /*
     * 8. Active member without management
     * permission cannot link.
     */
    let missingPermissionBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          memberWithoutManagePrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          archiveBlockedCase.id,
      })
    } catch (error: unknown) {
      missingPermissionBlocked =
        error instanceof Error &&
        error.message.startsWith(
          "MISSING_PERMISSION:"
        )
    }

    assert(
      missingPermissionBlocked,
      "OPERATIONAL_LINK_MANAGE_PERMISSION_NOT_ENFORCED"
    )

    /*
     * 9. Platform permission without membership
     * must still fail.
     */
    let nonMemberBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          outsiderPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          archiveBlockedCase.id,
      })
    } catch (error: unknown) {
      nonMemberBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberBlocked,
      "OPERATIONAL_LINK_NON_MEMBER_NOT_BLOCKED"
    )

    /*
     * Archive the underlying conversation.
     * Conversation owns operational availability.
     */
    await archiveConversationWithClient({
      client,

      principal:
        ownerPrincipal,

      conversationId:
        createdRoom.conversation.id,
    })

    /*
     * 10. Existing durable link still resolves.
     */
    const archivedExistingRetry =
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          caseRecord.id,
      })

    assert(
      archivedExistingRetry.id ===
        caseLink.id,
      "OPERATIONAL_LINK_ARCHIVED_EXISTING_RETRY_FAILED"
    )

    /*
     * 11. New link into archived room must fail.
     */
    let archivedNewLinkBlocked =
      false

    try {
      await linkOperationalRoomTargetWithClient({
        client,

        principal:
          ownerPrincipal,

        roomId:
          createdRoom.room.id,

        targetType:
          "CASE",

        targetSubtype:
          "CASE",

        targetId:
          archiveBlockedCase.id,
      })
    } catch (error: unknown) {
      archivedNewLinkBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ARCHIVED"
    }

    assert(
      archivedNewLinkBlocked,
      "OPERATIONAL_LINK_ARCHIVED_NEW_LINK_NOT_BLOCKED"
    )

    const blockedArchiveLinkCount =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId:
            createdRoom.room.id,

          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            archiveBlockedCase.id,
        },
      })

    assert(
      blockedArchiveLinkCount ===
        0,
      "OPERATIONAL_LINK_ARCHIVED_TARGET_PERSISTED"
    )

    console.log(
      "✓ Operational Room target linking smoke test passed"
    )

    console.log({
      targetFamilies: {
        case:
          true,

        opportunity:
          true,

        transactionDossier:
          true,

        transaction:
          true,

        treasuryGatewayAggregate:
          true,
      },

      exactRetryCanonical:
        true,

      concurrentRetryCanonical:
        true,

      duplicateEventPersisted:
        false,

      subtypeMismatchBlocked:
        true,

      missingTargetBlocked:
        true,

      arbitraryTreasurySubtypeBlocked:
        true,

      missingManagePermissionBlocked:
        true,

      nonMemberBlocked:
        true,

      archivedExistingRetryPreserved:
        true,

      archivedNewLinkBlocked:
        true,

      caseTargetUnchanged:
        true,

      treasuryTargetUnchanged:
        true,
    })
  } finally {
    if (roomId) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId:
            roomId,
        },
      })
    }

    if (conversationId) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversationId,
        },
      })

      /*
       * Conversation cascade removes the
       * OperationalRoom and all OperationalLinks.
       */
      await prisma.communicationConversation.deleteMany({
        where: {
          id:
            conversationId,
        },
      })
    }

    if (transactionId) {
      await prisma.transaction.deleteMany({
        where: {
          id:
            transactionId,
        },
      })
    }

    /*
     * Wallet is owned by the temporary owner and
     * must be removed before the User.
     */
    if (createdUserIds.length > 0) {
      await prisma.wallet.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })
    }

    if (opportunityId) {
      await prisma.opportunity.deleteMany({
        where: {
          id:
            opportunityId,
        },
      })
    }

    if (dossierId) {
      await prisma.transactionDossier.deleteMany({
        where: {
          id:
            dossierId,
        },
      })
    }

    const caseIds = [
      caseId,
      archivedCaseId,
    ].filter(
      (
        value
      ): value is string =>
        value !== null
    )

    if (caseIds.length > 0) {
      await prisma.case.deleteMany({
        where: {
          id: {
            in:
              caseIds,
          },
        },
      })
    }

    if (treasuryAggregateId) {
      await prisma.treasuryGatewayAggregate.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

          aggregateId:
            treasuryAggregateId,
        },
      })
    }

    if (createdUserIds.length > 0) {
      await prisma.userRole.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })

      await prisma.user.deleteMany({
        where: {
          id: {
            in:
              createdUserIds,
          },
        },
      })
    }
  }
}

main()
  .catch(
    error => {
      console.error(error)
      process.exitCode = 1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
