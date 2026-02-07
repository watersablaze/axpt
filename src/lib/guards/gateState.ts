export function assertGateCanBeVerified(status: string) {
  if (status === 'VERIFIED')
    throw new Error('GATE_ALREADY_VERIFIED');
  if (status !== 'PENDING' && status !== 'OPEN')
    throw new Error('GATE_NOT_VERIFIABLE');
}