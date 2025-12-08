'use client';

import { useEffect, useRef } from 'react';

export default function CeremonyRoom() {
  const containerRef = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: 'RiseOfTheMatriarchy2025',
      parentNode: containerRef.current,

      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableInitialGUM: false,           // IMPORTANT: must be FALSE now
        enableClosePage: false,
        requireDisplayName: false,
        startSilent: true,
        enableLobby: false,
        requireModerator: false,
      },

      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'black'
      }}
      ref={containerRef}
    />
  );
}