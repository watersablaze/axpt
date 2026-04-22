import type { CaseRecord, CaseGate } from '../types/caseTypes';

export function sortCaseGates(gates: CaseGate[]): CaseGate[] {
  return [...gates].sort((a, b) => a.order - b.order);
}

export function getActiveGate(gates: CaseGate[]): CaseGate | null {
  return sortCaseGates(gates).find((gate) => gate.status === 'ACTIVE') ?? null;
}

export function canCompleteCase(record: CaseRecord): boolean {
  return record.gates.every((gate) => gate.status === 'PASSED' || gate.status === 'SKIPPED');
}