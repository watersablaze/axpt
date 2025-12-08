'use client';

import { useEffect, useRef } from 'react';

export default function CeremonyRoom() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error("Jitsi API not loaded");
      return;
    }

    const domain = 'meet.jit.si';

    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName: 'AXPT_Matriarch_Monday_Sovereign_Room',
      parentNode: containerRef.current,

      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableInitialGUM: true,
        enableClosePage: false,
        startSilent: true,
        requireDisplayName: false,

        // THE MISSING KEY:
        authenticationEnable: false,
        enableLobby: false,
        requireModerator: false,
      },

      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        MOBILE_APP_PROMO: false,
      },

      userInfo: {
        displayName: "AXPT Observer"
      }
    });

    return () => api.dispose();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'black',
      }}
    />
  );
}