export type FrenchWardHomeParticipant = {
  name: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  reference: string | null;

  kind:
    | "GOVERNING"
    | "INSTITUTIONAL"
    | "ADMINISTRATIVE_REVIEW";

  capacityClass:
    | "STRATEGIC"
    | "OPERATIONS"
    | "FIDUCIARY"
    | null;
};

export type FrenchWardHomeMovement = {
  id: string;
  matterId: string;
  matterReference: string;
  matterTitle: string;

  sourceRecord: {
    kind: FrenchWardHomeMatterRecordKind;
    id: string;
    reference: string;
  };

  sourceEventId: string;

  message: string;
  actor: string | null;
  fromState: string | null;
  toState: string | null;
  occurredAt: string;
};

export type FrenchWardHomeMatterRecordKind =
  | "INTAKE"
  | "OPPORTUNITY"
  | "DOSSIER";

export type FrenchWardHomeMatterStage =
  | "RECEIVED"
  | "EMERGING"
  | "ACTIVE";

export type FrenchWardHomeMatter = {
  id: string;
  reference: string;
  title: string;
  recordKind: FrenchWardHomeMatterRecordKind;
  stage: FrenchWardHomeMatterStage;
  state: string;
  commodity: string | null;
  origin: string | null;
  quantityKg: string | null;
  parties: {
    role: string;
    legalName: string;
  }[];
  lastMovement: FrenchWardHomeMovement | null;
  pendingAttentionCount: number;
};

export type FrenchWardHomeAttention = {
  matterId: string;
  matterReference: string;
  matterTitle: string;
  kind: "PENDING_APPROVAL";
  label: string;
};

export type FrenchWardHomeDocument = {
  kind:
    | "INSTITUTIONAL_PROFILE"
    | "TRANSACTION_OVERVIEW";
  reference: string;
  version: number;
  title: string;
  access: "VIEW";
  href: string;
};

export type FrenchWardHomeActionPosture = {
  governing: boolean;
  sendLoi: boolean;
  registerBuyerTransaction: boolean;
  promoteIntakeToOpportunity: boolean;
};

export type FrenchWardHomeProjection = {
  participant: FrenchWardHomeParticipant;

  institution: {
    name: "French-Ward, Inc.";
  };

  matters: FrenchWardHomeMatter[];
  attention: FrenchWardHomeAttention[];
  recentMovement: FrenchWardHomeMovement[];
  documents: FrenchWardHomeDocument[];
};
