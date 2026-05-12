export const AXGEscrowABI = [
  {
    name: 'lockEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'caseId', type: 'bytes32' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'releaseEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'caseId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'disputeEscrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'caseId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'EscrowLocked',
    type: 'event',
    inputs: [
      { name: 'caseId', type: 'bytes32', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'EscrowReleased',
    type: 'event',
    inputs: [{ name: 'caseId', type: 'bytes32', indexed: true }],
  },
  {
    name: 'EscrowDisputed',
    type: 'event',
    inputs: [{ name: 'caseId', type: 'bytes32', indexed: true }],
  },
] as const
