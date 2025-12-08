'use client';

import { useEffect, useRef } from 'react';

export default function CeremonyRoom() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load script manually so OBS browser doesn't block it
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;

    script.onload = () => {
      const domain = 'meet.jit.si';

      const options = {
        roomName: 'RiseOfTheMatriarchy2025',
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,

        userInfo: {
          displayName: 'AXPT Studio', // forces bypass
          email: 'studio@axpt.io'
        },

        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          enableClosePage: false,
          startSilent: true,
          enableLobby: false,
          requireModerator: false,

          // ⭐ Force no authentication logic
          disableThirdPartyRequests: true,
          requireDisplayName: false,

          // ⭐ HARD OVERRIDE: ignore hardware checks
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          disableInitialGUM: false,
          startAudioOnly: false,
          startScreenSharing: false,
          startSilent: true,
        },

        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          MOBILE_APP_PROMO: false,

          // ⭐ Prevent OBS from tripping prejoin UI
          HIDE_INVITE_MORE_HEADER: true,
        },

        // ⭐ NOTHING can trigger login now
        overwriteConfig: {
          requireDisplayName: false,
        }
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);

      api.addListener('errorOccurred', (err) => {
        console.warn('Jitsi Error:', err);
      });
    };

    document.body.appendChild(script);

    return () => {
      // optional cleanup
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: 'black',
        overflow: 'hidden',
      }}
    />
  );
}