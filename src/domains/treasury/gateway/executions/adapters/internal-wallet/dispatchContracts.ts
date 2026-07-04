export type AuthorizedInternalWalletExecutionDispatchResult = Readonly<{
  gatewayExecutionId: string;

  gatewayHandoffId: string;

  treasuryActionId: string;

  treasuryActionStatus: string;

  treasuryQueueJobId: string;

  treasuryQueueStatus: string;
}>;
