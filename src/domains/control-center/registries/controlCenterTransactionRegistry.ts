import {
  INDERAKSH_TRANSACTION_CONTINUITY,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";

export type ControlCenterTransactionRegistryEntry = {
  reference: string;
  label: string;
  transactionState: string;
  documentState: string;
  settlementState: string;
  instrumentReferences: readonly string[];
  operatorHref: string;
};

export function getControlCenterTransactionRegistry(): readonly ControlCenterTransactionRegistryEntry[] {
  return [
    {
      reference: INDERAKSH_TRANSACTION_REFERENCE,
      label: INDERAKSH_TRANSACTION_CONTINUITY.transactionLabel,
      transactionState:
        INDERAKSH_TRANSACTION_CONTINUITY.currentState.transaction,
      documentState:
        INDERAKSH_TRANSACTION_CONTINUITY.currentState.documents,
      settlementState:
        INDERAKSH_TRANSACTION_CONTINUITY.currentState.settlement,
      instrumentReferences:
        INDERAKSH_TRANSACTION_CONTINUITY.governingDocuments
          .filter((document) => document.kind === "DSI")
          .map((document) => document.reference),
      operatorHref:
        `/admin/control-center/transactions/${INDERAKSH_TRANSACTION_REFERENCE}`,
    },
  ] as const;
}
