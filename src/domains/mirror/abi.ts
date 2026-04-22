export const MIRROR_BRIDGE_ABI = [
  {
    type: 'function',
    name: 'mirrorTransfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'idempotencyKey', type: 'bytes32' },
      { name: 'walletEventId', type: 'bytes32' },
      { name: 'tokenType', type: 'bytes32' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;