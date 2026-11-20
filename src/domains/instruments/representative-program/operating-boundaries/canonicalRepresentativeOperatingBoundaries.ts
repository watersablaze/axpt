import {
  REPRESENTATIVE_AUTHORITY_KEY,
} from "../contracts";

import {
  REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS,
  REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT,
  assertRepresentativeOperatingBoundaries,
  type RepresentativeOperatingBoundaries,
} from "./contracts";

/**
 * Representative-facing operating policy.
 *
 * This policy explains the boundary around representative activity.
 * It does not create, grant, reserve, prohibit, activate, or evaluate
 * InstrumentAuthority.
 *
 * Actual authority remains governed by the Representative Appointment,
 * recorded InstrumentAuthority, exercisability, applicability, and any
 * transaction-specific governing instrument.
 */
export const REPRESENTATIVE_OPERATING_BOUNDARIES:
  RepresentativeOperatingBoundaries = {
    reference:
      "FW-RP-BOUNDARIES-2026-001",

    version:
      1,

    status:
      REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
        .CURRENT,

    title:
      "Representative Operating Boundaries",

    scope:
      "French-Ward Authorized Representation Program",

    authorityStatement:
      "These boundaries describe representative conduct and authority dependencies. They do not themselves grant authority. Actual authority is determined by the written appointment, recorded authority disposition, current exercisability, applicable conditions, and governing transaction instruments.",

    boundaries: [
      {
        key:
          "ACCESS_CONTROLLED_MATERIALS",

        title:
          "Access controlled materials",

        statement:
          "Access to French-Ward materials does not itself grant authority to act on behalf of French-Ward.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.ACCESS,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Use controlled materials only within the access and purpose actually authorized.",
      },

      {
        key:
          "MAKE_INTRODUCTIONS",

        title:
          "Make introductions",

        statement:
          "Introductions made in a French-Ward representative capacity require applicable Introduction Authority.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Do not imply institutional capacity beyond the authority recorded for your appointment.",
      },

      {
        key:
          "COMMUNICATE_APPROVED_INFORMATION",

        title:
          "Communicate approved information",

        statement:
          "Representative communication on behalf of French-Ward must remain within expressly authorized institutional and commercial information.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Communicate approved information as released. Do not invent or extend commercial terms.",
      },

      {
        key:
          "PRESENT_RELEASED_MATERIALS",

        title:
          "Present released materials",

        statement:
          "Presentation of French-Ward materials in a representative capacity requires applicable Presentation Authority.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Present released materials without implying authority not recorded in your appointment or authority schedule.",
      },

      {
        key:
          "COORDINATE_COMMERCIAL_ACTIVITY",

        title:
          "Coordinate commercial activity",

        statement:
          "Commercial coordination must remain within applicable Coordination Authority and governing commercial parameters.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.COORDINATION,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Coordinate activity without independently changing transaction terms or institutional commitments.",
      },

      {
        key:
          "NEGOTIATE_COMMERCIAL_TERMS",

        title:
          "Negotiate commercial terms",

        statement:
          "Commercial terms may not be invented, altered, extended, negotiated, or communicated beyond authority expressly recorded by French-Ward.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY_AND_APPROVAL,

        representativeInstruction:
          "Treat negotiation as controlled activity. Follow recorded approval conditions and remain within approved commercial parameters.",
      },

      {
        key:
          "EXERCISE_DOCUMENTARY_AUTHORITY",

        title:
          "Exercise documentary authority",

        statement:
          "Access to or presentation of a document does not itself confer authority to issue, alter, execute, or otherwise exercise documentary authority.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY
            .DOCUMENTARY_AUTHORITY,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Use documents only in the capacity expressly supported by recorded Documentary Authority and applicable document controls.",
      },

      {
        key:
          "BIND_FRENCH_WARD",

        title:
          "Bind French-Ward",

        statement:
          "No relationship, title, discussion, appointment access, or released material independently grants authority to execute, sign, accept, or otherwise bind French-Ward.",

        authorityKey:
          REPRESENTATIVE_AUTHORITY_KEY
            .BINDING_AUTHORITY,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY,

        representativeInstruction:
          "Do not bind French-Ward unless Binding Authority is separately recorded and presently exercisable.",
      },

      {
        key:
          "SUBDELEGATE_AUTHORITY",

        title:
          "Subdelegate authority",

        statement:
          "French-Ward authority may not be transferred, delegated, or conferred to another person merely by representative action.",

        authorityKey:
          null,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .WRITTEN_AUTHORIZATION,

        representativeInstruction:
          "Do not delegate or confer authority unless French-Ward expressly authorizes that action in writing.",
      },

      {
        key:
          "HANDLE_NONPUBLIC_INFORMATION",

        title:
          "Handle non-public information",

        statement:
          "Non-public French-Ward information and transaction materials must be handled only for authorized purposes.",

        authorityKey:
          null,

        requirement:
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .AUTHORIZED_PURPOSE_ONLY,

        representativeInstruction:
          "Protect non-public information and use it only for the authorized representative purpose.",
      },
    ],
  };

assertRepresentativeOperatingBoundaries(
  REPRESENTATIVE_OPERATING_BOUNDARIES,
);
