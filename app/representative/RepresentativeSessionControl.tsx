"use client";

import { useState } from "react";
import canvas from "./workspace-canvas.module.css";

export default function RepresentativeSessionControl({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setSignOutFailed(false);

    try {
      const response = await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setSignOutFailed(true);
        setSigningOut(false);
        return;
      }

      try {
        localStorage.removeItem("axpt_verified_token");
      } catch {
        // Legacy browser storage is optional.
      }

      window.location.assign("/login?next=/representative");
    } catch {
      setSignOutFailed(true);
      setSigningOut(false);
    }
  }

  return (
    <div className={canvas.commandSession}>
      <button
        type="button"
        onClick={readOnlyPreview ? undefined : handleSignOut}
        disabled={signingOut}
        aria-disabled={readOnlyPreview || undefined}
        className={canvas.commandSignOut}
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>

      {signOutFailed ? (
        <span role="status" className={canvas.signOutFailure}>
          Sign out failed. Session remains active.
        </span>
      ) : null}
    </div>
  );
}
