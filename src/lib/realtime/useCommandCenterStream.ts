// src/lib/realtime/useCommandCenterStream.ts
"use client";

import { useEffect, useState } from "react";

export type DomainEvent = {
  type: string;
  createdAt: string;
  streamId?: string;
  payload?: any;
};

type NextAction = {
  caseId: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

type Bottlenecks = {
  waitingSignature: number;
  waitingArtifact: number;
  escrowPending: number;
};

type SystemState = {
  events: DomainEvent[];
  activeCases: number;
  pendingGates: number;
  lockedEscrows: number;
  alerts: number;
  nextActions: NextAction[];
  bottlenecks: Bottlenecks;
};

const initialState: SystemState = {
  events: [],
  activeCases: 0,
  pendingGates: 0,
  lockedEscrows: 0,
  alerts: 0,
  nextActions: [],
  bottlenecks: {
    waitingSignature: 0,
    waitingArtifact: 0,
    escrowPending: 0,
  },
};

export function useCommandCenterStream() {
  const [state, setState] = useState<SystemState>(initialState);

  useEffect(() => {
    let closed = false;

    async function hydrateSnapshot() {
      try {
        const res = await fetch("/api/admin/system-snapshot", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const snapshot = await res.json();

        if (!closed) {
          setState((prev) => ({
            ...prev,
            ...snapshot,
          }));
        }
      } catch {
        // keep silent for now; SSE can still populate live state
      }
    }

    hydrateSnapshot();

    const source = new EventSource("/api/admin/events/stream");

    source.onmessage = (event) => {
      const e: DomainEvent = JSON.parse(event.data);

      setState((prev) => {
        const events = [e, ...prev.events].slice(0, 100);

        let activeCases = prev.activeCases;
        let pendingGates = prev.pendingGates;
        let lockedEscrows = prev.lockedEscrows;
        let alerts = prev.alerts;

        const nextActions = [...prev.nextActions];
        const bottlenecks = { ...prev.bottlenecks };

        if (e.type === "CASE_CREATED") {
          activeCases += 1;
        }

        if (e.type === "CASE_COMPLETED") {
          activeCases = Math.max(0, activeCases - 1);
        }

        if (e.type === "GATE_REQUIRED") {
          pendingGates += 1;
        }

        if (e.type === "GATE_VERIFIED") {
          pendingGates = Math.max(0, pendingGates - 1);
        }

        if (e.type === "ESCROW_PENDING") {
          bottlenecks.escrowPending += 1;
          nextActions.unshift({
            caseId: e.streamId ?? "unknown",
            message: "Lock escrow",
            priority: "HIGH",
          });
        }

        if (e.type === "ESCROW_LOCKED") {
          lockedEscrows += 1;
          bottlenecks.escrowPending = Math.max(
            0,
            bottlenecks.escrowPending - 1
          );
        }

        if (e.type === "SIGNATURE_REQUIRED") {
          bottlenecks.waitingSignature += 1;
          nextActions.unshift({
            caseId: e.streamId ?? "unknown",
            message: "Collect signature",
            priority: "HIGH",
          });
        }

        if (e.type === "SIGNATURE_COMPLETED") {
          bottlenecks.waitingSignature = Math.max(
            0,
            bottlenecks.waitingSignature - 1
          );
        }

        if (e.type === "ARTIFACT_REQUIRED") {
          bottlenecks.waitingArtifact += 1;
          nextActions.unshift({
            caseId: e.streamId ?? "unknown",
            message: "Upload required document",
            priority: "MEDIUM",
          });
        }

        if (e.type === "DOCUMENT_UPLOADED") {
          bottlenecks.waitingArtifact = Math.max(
            0,
            bottlenecks.waitingArtifact - 1
          );
        }

        if (e.type.includes("FAILED") || e.type.includes("ERROR")) {
          alerts += 1;
        }

        return {
          events,
          activeCases,
          pendingGates,
          lockedEscrows,
          alerts,
          nextActions: nextActions.slice(0, 10),
          bottlenecks,
        };
      });
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      closed = true;
      source.close();
    };
  }, []);

  return state;
}