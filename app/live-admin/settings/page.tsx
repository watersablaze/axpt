"use client";

import BrandingPanel from "./BrandingPanel";
import StreamingPanel from "./StreamingPanel";
import ModerationPanel from "./ModerationPanel";
import AccessControl from "./AccessControl";
import ApiKeysPanel from "./ApiKeysPanel";

export default function SettingsPage() {
  return (
    <div className="settingsPage p-10 space-y-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Settings & Configuration</h1>

      <BrandingPanel />
      <StreamingPanel />
      <ModerationPanel />
      <AccessControl />
      <ApiKeysPanel />
    </div>
  );
}