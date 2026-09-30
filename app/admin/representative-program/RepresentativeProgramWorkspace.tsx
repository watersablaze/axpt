"use client";

import { useState } from "react";

import RepresentativeInvitationForm from "./RepresentativeInvitationForm";
import RepresentativeIntakeInspector from "./RepresentativeIntakeInspector";

export default function RepresentativeProgramWorkspace() {
  const [focusedIntakeId, setFocusedIntakeId] = useState<string | null>(null);

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.7fr)] lg:items-start">
      <div className="lg:sticky lg:top-6">
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
