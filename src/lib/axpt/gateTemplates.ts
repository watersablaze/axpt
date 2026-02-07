// src/lib/axpt/gateTemplates.ts
export type GateTemplateItem = {
  description: string;
  evidence?: string[];
  notes?: string;
};

export const GATE_1_ITEMS: GateTemplateItem[] = [
  {
    description: 'Seller Identity Verified',
    evidence: ['Government-issued ID (individual)', 'Certificate of incorporation (entity)', 'Business registration extract'],
  },
  {
    description: 'Seller Authority to Act Confirmed',
    evidence: ['Board resolution', 'Power of attorney', 'Mandate letter'],
  },
  {
    description: 'Buyer Identity Verified',
    evidence: ['Passport / national ID', 'Corporate registration documents'],
  },
  {
    description: 'Buyer Authority to Act Confirmed',
    evidence: ['Board resolution', 'Power of attorney', 'Mandate letter'],
  },
  {
    description: 'Sanctions / Restricted Party Check Completed',
    notes: 'AXPT confirms review, not compliance guarantees.',
  },
  {
    description: 'Party Information Consistency Check',
  },
];

export const GATE_2_ITEMS: GateTemplateItem[] = [
  { description: 'Transaction Description Aligned' },
  { description: 'Commercial Terms Acknowledged', notes: 'No validation of fairness or enforceability.' },
  { description: 'Jurisdictional Context Confirmed' },
  { description: 'Payment Structure Described (Non-Executable)', notes: 'Does not authorize payment.' },
  { description: 'Escrow / Intermediary Intent Acknowledged' },
  { description: 'No Material Term Disputes Declared' },
];

export const GATE_3_ITEMS: GateTemplateItem[] = [
  { description: 'Escrow Entity Identified', notes: 'Identification ≠ engagement.' },
  { description: 'Escrow Acceptance Confirmed (If Applicable)' },
  { description: 'Settlement Rails Identified', notes: 'AXPT does not validate rails.' },
  { description: 'Compliance Pathway Confirmed', notes: 'KYC/KYB, approvals, licensing pathway acknowledged.' },
  { description: 'Operational Dependencies Ready', notes: 'Logistics, documentation workflow, technical readiness.' },
  { description: 'No Outstanding Readiness Blocks Declared' },
];

// Map by gate ord (1..3)
export const DEFAULT_GATE_ITEM_TEMPLATES: Record<number, GateTemplateItem[]> = {
  1: GATE_1_ITEMS,
  2: GATE_2_ITEMS,
  3: GATE_3_ITEMS,
};