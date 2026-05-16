import type {
  TransferContext,
  TransferIntent,
} from '@/domains/wallet/types/transferContext'

import {
  classifyRisk,
  type RiskLevel as TransferRiskLevel,
} from '@/domains/risk/classifyRisk'

import { computeRiskScore } from '@/domains/risk/computeRiskScore'
import { evaluateUserTransferPolicy } from './evaluateUserTransferPolicy'
import { getUserTrustScore } from '@/domains/trust/getUserTrustScore'
import { isAdmin as hasAdminAccess } from "@/domains/auth/isAdmin"

export type { TransferIntent }

export type TransferPolicyResult =
  | {
      action: 'ALLOW'
      riskScore: number
      riskLevel: TransferRiskLevel
    }
  | {
      action: 'REQUIRE_APPROVAL'
      code: 'TREASURY_APPROVAL_REQUIRED' | 'RISK_HIGH' | 'RISK_MEDIUM'
      reason: string
      approvalType: 'SINGLE' | 'DUAL' | 'COUNCIL'
      riskScore?: number
      riskLevel?: TransferRiskLevel
    }
  | {
      action: 'DENY'
      code: string
      reason: string
    }

function evaluateTreasuryTransferPolicy(
  input: TransferContext
): TransferPolicyResult {
  const { principal, amountBaseUnits } = input

  if (!principal.roles.includes('TREASURY_OPERATOR')) {
    return {
      action: 'DENY',
      code: 'TREASURY_FORBIDDEN',
      reason: 'Only treasury operators can initiate treasury transfers',
    }
  }

  if (amountBaseUnits <= 25_000000n) {
    return {
      action: 'ALLOW',
      riskScore: 0,
      riskLevel: 'LOW',
    }
  }

  if (amountBaseUnits <= 250_000000n) {
    return {
      action: 'REQUIRE_APPROVAL',
      code: 'TREASURY_APPROVAL_REQUIRED',
      reason: 'Requires single approval',
      approvalType: 'SINGLE',
      riskScore: 0,
      riskLevel: 'LOW',
    }
  }

  if (amountBaseUnits <= 1000_000000n) {
    return {
      action: 'REQUIRE_APPROVAL',
      code: 'TREASURY_APPROVAL_REQUIRED',
      reason: 'Requires dual approval',
      approvalType: 'DUAL',
      riskScore: 0,
      riskLevel: 'LOW',
    }
  }

  return {
    action: 'REQUIRE_APPROVAL',
    code: 'TREASURY_APPROVAL_REQUIRED',
    reason: 'Requires council approval',
    approvalType: 'COUNCIL',
    riskScore: 0,
    riskLevel: 'LOW',
  }
}

export async function evaluateTransferPolicy(
  input: TransferContext
): Promise<TransferPolicyResult> {
  const {
    principal,
    senderUserId,
    recipientUserId,
    amountBaseUnits,
    intent,
  } = input

  if (!principal.permissions.includes('WALLET_TRANSFER')) {
    return {
      action: 'DENY',
      code: 'FORBIDDEN',
      reason: 'Missing WALLET_TRANSFER permission',
    }
  }

   if (!hasAdminAccess(principal)) {
    return {
      action: 'DENY',
      code: 'FORBIDDEN_ACTOR_SCOPE',
      reason: 'Cannot transfer on behalf of another user',
    }
  }


  if (amountBaseUnits <= 0n) {
    return {
      action: 'DENY',
      code: 'INVALID_AMOUNT',
      reason: 'Amount must be positive',
    }
  }

  if (intent === 'TREASURY') {
    return evaluateTreasuryTransferPolicy(input)
  }

  const userPolicy = await evaluateUserTransferPolicy(input)

  if (userPolicy.action !== 'ALLOW') {
    return userPolicy
  }

  const trust = await getUserTrustScore(principal.userId)

  const riskAssessment = await computeRiskScore({
    userId: principal.userId,
    amountBaseUnits,
    recipientUserId,
  })

  const riskScore = riskAssessment.score
  const riskLevel = classifyRisk(riskScore)

  const reasonParts = [...riskAssessment.reasons]
  reasonParts.push(`TRUST_TIER:${trust.tier}`)
  reasonParts.push(`TRUST_SCORE:${Math.round(trust.score)}`)

  const reasonText =
    reasonParts.length > 0
      ? reasonParts.join(', ')
      : 'Risk threshold triggered'

  // HIGH risk: trusted users can be routed to DUAL, otherwise COUNCIL
  if (riskLevel === 'HIGH') {
    const approvalType: 'DUAL' | 'COUNCIL' =
      trust.score > 70 ? 'DUAL' : 'COUNCIL'

    return {
      action: 'REQUIRE_APPROVAL',
      code: 'RISK_HIGH',
      reason: reasonText,
      approvalType,
      riskScore,
      riskLevel,
    }
  }

  // MEDIUM risk:
  // - elite/high trust can go SINGLE
  // - medium trust goes DUAL
  // - low trust escalates to COUNCIL
  if (riskLevel === 'MEDIUM') {
    let approvalType: 'SINGLE' | 'DUAL' | 'COUNCIL' = 'DUAL'

    if (trust.score > 80) {
      approvalType = 'SINGLE'
    } else if (trust.tier === 'LOW') {
      approvalType = 'COUNCIL'
    }

    return {
      action: 'REQUIRE_APPROVAL',
      code: 'RISK_MEDIUM',
      reason: reasonText,
      approvalType,
      riskScore,
      riskLevel,
    }
  }

  return {
    action: 'ALLOW',
    riskScore,
    riskLevel,
  }
}