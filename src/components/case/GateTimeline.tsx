import { GateCard } from './GateCard';

export type PortalRole = 'internal' | 'seller' | 'buyer';

type Gate = {
  id: string;
  ord: number;
  status: string;
  name: string;
  items?: any[];
  caseId?: string; // optional if you attach it upstream
};

type Props = {
  gates: Gate[];
  role: PortalRole;
  caseStatus?: string;

  /**
   * Optional override. If omitted, GateTimeline will compute it.
   * If case is locked, active gate will be forced to null.
   */
  activeGateOrd?: number | null;
};

export function GateTimeline({
  gates,
  role,
  caseStatus,
  activeGateOrd,
}: Props) {
  const caseLocked = caseStatus === 'ESCROW_INITIATED';

  const computedActiveGateOrd =
    gates.find((g) => g.status !== 'VERIFIED')?.ord ?? null;

  // Final rule: locked case => no active gate highlight
  const finalActiveGateOrd = caseLocked ? null : (activeGateOrd ?? computedActiveGateOrd);

  return (
    <section className="mb-10">
      <h2 className="text-lg font-medium mb-4">Verification Gates</h2>

      <div className="space-y-4">
        {gates.map((gate) => {
          const isSealed = gate.status === 'VERIFIED';
          const isActive = !caseLocked && gate.ord === finalActiveGateOrd;

          return (
            <GateCard
              key={gate.id}
              gate={gate}
              role={role}
              isSealed={isSealed}
              isActive={isActive}
              disabled={caseLocked}
            />
          );
        })}
      </div>
    </section>
  );
}