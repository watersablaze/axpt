"use client";

import { useState } from "react";

import RepresentativeInvitationForm from "./RepresentativeInvitationForm";
import RepresentativeIntakeInspector from "./RepresentativeIntakeInspector";

export default function RepresentativeProgramWorkspace() {
  const [focusedIntakeId, setFocusedIntakeId] = useState<string | null>(null);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.65fr)] xl:items-start">
      <div className="xl:sticky xl:top-6">
        <RepresentativeInvitationForm
          onIssued={(intakeId) => setFocusedIntakeId(intakeId)}
        />
      </div>

      <RepresentativeIntakeInspector
        focusedIntakeId={focusedIntakeId}
        onFocusedIntakeChange={setFocusedIntakeId}
      />
    </section>
  );
}
