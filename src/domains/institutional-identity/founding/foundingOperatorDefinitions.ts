import type {
  InstitutionalAuthority,
  InstitutionalOrganizationalUnit,
  InstitutionalRoleClass,
  InstitutionalStanding,
} from "@prisma/client"

export type FoundingOperatorKey =
  | "MAYA"
  | "JAMAL"
  | "BOBBY"
  | "LAWRENCE"

export type FoundingOperatorDefinition = Readonly<{
  key: FoundingOperatorKey
  envUsernameKey: string
  operatorCode: string
  displayName: string
  institutionalTitle: string
  roleClass: InstitutionalRoleClass
  organizationalUnit: InstitutionalOrganizationalUnit
  standing: InstitutionalStanding
  reportsToKey?: FoundingOperatorKey
  fiduciaryIndependent: boolean
  summary: string
  authorities: readonly InstitutionalAuthority[]
}>

export const FOUNDING_OPERATOR_DEFINITIONS: readonly FoundingOperatorDefinition[] = [
  {
    key: "MAYA",
    envUsernameKey: "AXPT_MAYA_USERNAME",
    operatorCode: "FW-MAYA-001",
    displayName: "Ma’yá",
    institutionalTitle:
      "Founder / Institutional Architect / Executive Authority",
    roleClass: "EXECUTIVE_AUTHORITY",
    organizationalUnit: "EXECUTIVE",
    standing: "ACTIVE",
    fiduciaryIndependent: false,
    summary:
      "Establishes institutional architecture, governance, strategic direction, and governed operating boundaries.",
    authorities: [
      "ACCESS",
      "COMMUNICATION",
      "PRESENTATION",
      "COORDINATION",
      "NEGOTIATION",
      "DOCUMENT_PREPARATION",
      "DOCUMENT_REVIEW",
      "DOCUMENT_APPROVAL",
      "COMMERCIAL_REVIEW",
      "COMMERCIAL_APPROVAL",
      "OPERATION_ASSIGNMENT",
      "OPERATION_SUSPENSION",
      "TRANSACTION_INITIATION",
      "TRANSACTION_REVIEW",
      "TRANSACTION_APPROVAL",
      "TREASURY_REQUEST",
      "TREASURY_REVIEW",
      "INSTRUMENT_CREATION",
      "INSTRUMENT_ISSUANCE",
      "GOVERNANCE_ADMINISTRATION",
      "SYSTEM_ADMINISTRATION",
    ],
  },
  {
    key: "JAMAL",
    envUsernameKey: "AXPT_JAMAL_USERNAME",
    operatorCode: "FW-JAMAL-001",
    displayName: "Jamal",
    institutionalTitle:
      "President / Lead Strategist / Senior Operating Authority",
    roleClass: "SENIOR_OPERATING_AUTHORITY",
    organizationalUnit: "STRATEGY",
    standing: "ACTIVE",
    reportsToKey: "MAYA",
    fiduciaryIndependent: false,
    summary:
      "Translates institutional intent into coordinated strategy, executive judgment, and operational continuity.",
    authorities: [
      "ACCESS",
      "INTRODUCTION",
      "COMMUNICATION",
      "PRESENTATION",
      "COORDINATION",
      "NEGOTIATION",
      "DOCUMENT_PREPARATION",
      "DOCUMENT_REVIEW",
      "COMMERCIAL_REVIEW",
      "COMMERCIAL_APPROVAL",
      "OPERATION_ASSIGNMENT",
      "OPERATION_SUSPENSION",
      "TRANSACTION_INITIATION",
      "TRANSACTION_REVIEW",
      "TRANSACTION_APPROVAL",
      "TREASURY_REQUEST",
      "TREASURY_REVIEW",
      "INSTRUMENT_CREATION",
    ],
  },
  {
    key: "BOBBY",
    envUsernameKey: "AXPT_BOBBY_USERNAME",
    operatorCode: "FW-BOBBY-001",
    displayName: "Bobby",
    institutionalTitle:
      "Field Operations Lead / Logistics Specialist / Commercial Operator",
    roleClass: "FIELD_OPERATOR",
    organizationalUnit: "OPERATIONS",
    standing: "ACTIVE",
    reportsToKey: "JAMAL",
    fiduciaryIndependent: false,
    summary:
      "Moves authorized institutional intention through counterparties, logistics, field coordination, and documentary collection.",
    authorities: [
      "ACCESS",
      "INTRODUCTION",
      "COMMUNICATION",
      "PRESENTATION",
      "COORDINATION",
      "DOCUMENT_PREPARATION",
      "TRANSACTION_INITIATION",
      "TREASURY_REQUEST",
    ],
  },
  {
    key: "LAWRENCE",
    envUsernameKey: "AXPT_LAWRENCE_USERNAME",
    operatorCode: "FW-LAWRENCE-001",
    displayName: "Lawrence",
    institutionalTitle:
      "Escrow Counsel / Fiduciary Authority",
    roleClass: "FIDUCIARY_AUTHORITY",
    organizationalUnit: "FIDUCIARY",
    standing: "ACTIVE",
    fiduciaryIndependent: true,
    summary:
      "Governs legal, escrow, settlement, and fiduciary review boundaries where institutional action creates legal or financial consequence.",
    authorities: [
      "ACCESS",
      "COMMUNICATION",
      "DOCUMENT_REVIEW",
      "LEGAL_REVIEW",
      "FIDUCIARY_REVIEW",
      "FIDUCIARY_APPROVAL",
      "TRANSACTION_REVIEW",
      "TREASURY_REVIEW",
    ],
  },
] as const
