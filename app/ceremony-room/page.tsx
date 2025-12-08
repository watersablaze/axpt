"use client";

import { useEffect, useRef } from "react";

export default function CeremonyRoom() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load Jitsi external API script
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;

    script.onload = () => {
      const domain = "meet.jit.si";

      const options = {
        roomName: "AXPT-Matriarch-Monday-08DEC-CEREMONY-ROOM",
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Guest",
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "chat",
            "tileview",
            "hangup",
            "settings",
            "select-background"
          ],
        },
        configOverwrite: {
          prejoinConfig: {
            enabled: false,
          },
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          enableLobby: false,
          requireDisplayName: false,
        },
      };

      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(domain, options);

      // Optional: auto-set your display name
      api.addEventListener("videoConferenceJoined", () => {
        api.executeCommand("displayName", "Ma’yá");
      });
    };

    document.body.appendChild(script);
  }, []);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </main>
  );
}