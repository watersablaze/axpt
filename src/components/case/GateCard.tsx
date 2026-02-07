'use client';

import { useState } from 'react';
import { ItemRow } from './ItemRow';
import { EscrowAuthorizationModal } from './EscrowAuthorizationModal';
import type { PortalRole } from './GateTimeline';

type GateWithItems = {
  id: string;
  ord: number;
  name: string;
  status: string;
  items?: any[];
  caseId?: string;
};

type Props = {
  gate: GateWithItems;
  role: PortalRole;
  isSealed: boolean;
  isActive: boolean;
  disabled?: boolean;
};

/**
 * Role-based visibility for verification items.
 */
function itemVisibleToRole(
  gateOrd: number,
  itemOrd: number | null,
  role: PortalRole
) {
  if (role === 'internal') return true;

  if (gateOrd === 1) {
    if (itemOrd === 1 || itemOrd === 2) return role === 'seller';
    if (itemOrd === 3 || itemOrd === 4) return role === 'buyer';
    if (itemOrd === 5 || itemOrd === 6) return true;
  }

  return true;
}

export function GateCard({
  gate,
  role,
  isSealed,
  isActive,
  disabled = false,
}: Props) {
  const isInternal = role === 'internal';
  const isGate3 = gate.ord === 3;
  const isGate4 = gate.ord === 4;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = (gate.items ?? []).filter((it) =>
    itemVisibleToRole(gate.ord, it.ord ?? null, role)
  );

  return (
    <>
      <div
        className={[
          'border border-white/10 rounded-lg p-4 space-y-3',
          isActive ? 'bg-white/5' : 'bg-transparent',
          isSealed ? 'opacity-90' : '',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">{gate.name}</h3>
            <div className="text-xs text-white/50">
              {isSealed ? 'SEALED' : isActive ? 'ACTIVE' : 'PENDING'} · {gate.status}
            </div>
          </div>

          {isSealed && (
            <span className="text-[11px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-200">
              sealed
            </span>
          )}
        </div>

        {/* Party-facing sealed collapse */}
        {!isInternal && isSealed ? (
          <div className="text-xs text-white/60 leading-relaxed">
            This verification gate has been completed and sealed.
            <br />
            No further action is required at this stage.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                allowUpload={!isInternal && !disabled}
                disabled={disabled || !isInternal}
              />
            ))}
          </div>
        )}

        {/* Gate 1 & 2 PDFs (internal only) */}
        {isInternal && isSealed && gate.ord <= 2 && (
          <div className="pt-2">
            <a
              href={`/api/axpt/confirmations/gate/${gate.id}/pdf`}
              target="_blank"
              className="inline-block text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Issue Gate {gate.ord} Verification Record (PDF)
            </a>
          </div>
        )}

        {/* Gate 3 — System Readiness */}
        {isInternal && isGate3 && isActive && !isSealed && !disabled && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-xs text-white/70 leading-relaxed">
              <strong>System Readiness Review</strong>
              <br />
              Confirm that all submitted materials are complete, internally consistent,
              and procedurally suitable to advance toward escrow authorization.
            </div>

            <form
              method="POST"
              action={`/api/axpt/gates/${gate.id}/seal`}
            >
              <button className="text-xs px-3 py-2 rounded bg-blue-600/20 hover:bg-blue-600/30">
                Confirm System Readiness
              </button>
            </form>

            <div className="text-[11px] text-white/40 leading-snug">
              This action seals Gate 3.
              It does not authorize escrow or lock the case.
            </div>
          </div>
        )}

        {/* Gate 4 — Escrow Authorization */}
        {isInternal && isGate4 && isActive && !isSealed && !disabled && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="text-xs text-white/70 leading-relaxed">
              <strong>Escrow Authorization</strong>
              <br />
              All prior verification gates have been sealed.
              You may now authorize procedural escrow handoff.
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              className="text-xs px-3 py-2 rounded bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-100"
            >
              <a
                href={`/api/axpt/cases/${gate.caseId}/escrow-summary/pdf`}
                target="_blank"
                className="inline-block text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                Preview Escrow Summary (PDF)
              </a>
              
              Authorize Escrow Handoff
            </button>

            <div className="text-[11px] text-white/40 leading-snug">
              This action locks the case and issues a cryptographic escrow verification record.
              AXPT does not custody funds or execute transactions.
            </div>
          </div>
        )}

        {/* Locked notice */}
        {disabled && (
          <div className="pt-2 text-xs text-orange-300/80">
            This case is locked. No further actions are permitted.
          </div>
        )}
      </div>

      {/* Escrow confirmation modal */}
      {isGate4 && gate.caseId && (
        <EscrowAuthorizationModal
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          caseId={gate.caseId}
        />
      )}
    </>
  );
}