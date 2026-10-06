"use client";

import { useState } from "react";

import RepresentativeInvitationForm from "./RepresentativeInvitationForm";
import RepresentativeIntakeInspector from "./RepresentativeIntakeInspector";

export default function RepresentativeProgramWorkspace() {
  const [focusedIntakeId, setFocusedIntakeId] = useState<string | null>(null);
  const [invitationOpen, setInvitationOpen] = useState(false);

  function focusIntake(intakeId: string) {
    setFocusedIntakeId(intakeId);
    setInvitationOpen(true);
  }

  return (
    <section className="mt-6 space-y-5">
      <details
        open={invitationOpen}
        onToggle={(event) => setInvitationOpen(event.currentTarget.open)}
        className="group border-b border-gray-900 pb-5"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1">
          <span className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-700">
              Operator Tool
            </span>

            <span className="text-sm font-medium text-gray-300">
              New Representative Invitation
            </span>
          </span>

          <span className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-600 transition group-open:text-gray-400">
            {invitationOpen ? "Collapse" : "Open"}
          </span>
        </summary>

        <div className="mt-4 max-w-3xl">
          <RepresentativeInvitationForm onIssued={focusIntake} />
        </div>
      </details>

      <RepresentativeIntakeInspector
        focusedIntakeId={focusedIntakeId}
        onFocusedIntakeChange={setFocusedIntakeId}
      />
    </section>
  );
}
