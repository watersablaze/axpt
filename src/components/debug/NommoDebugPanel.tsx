'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMirrorRay } from '@/lib/context/MirrorRayContext';
import { useDebugHotkey } from '@/hooks/useDebugHotkey';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

import CeremonyTab from './tabs/CeremonyTab';
import AuraDebugPanel from '@/components/devtools/AuraDebugPanel';
import BloomControl from '@/components/dev/BloomControl';
import PerformanceWarning from './PerformanceWarning';
import ModeTab from './tabs/ModeTab';

import LiveTab from '@/components/devtools/LiveTab';
import { eventBus } from '@/lib/oracle/EventBus';

export default function NommoDebugPanel() {
  const pathname = usePathname();
  const performanceMode = usePerformanceMode();
  const { color, uiMode } = useMirrorRay();

  const TABS = ['live', 'system', 'aura', 'bloom', 'ceremony', 'mode'] as const;
  const [selectedTab, setSelectedTab] = useState<(typeof TABS)[number]>('live');
  const [open, setOpen] = useState(false);

  const [pos, setPos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 320 : 20,
    y: typeof window !== 'undefined' ? window.innerHeight - 260 : 20,
  }));

  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
  const [scroll, setScroll] = useState(0);

  // hotkey toggle
  useDebugHotkey(() => setOpen((v) => !v));

  // window resize
  useEffect(() => {
    const handler = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // scroll tracking
  useEffect(() => {
    const handler = () => setScroll(window.scrollY);
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // 🔮 listen for tab switches from EventBus
  useEffect(() => {
    const unsub = eventBus.on('nommo:switch-tab', ({ data }) => {
      if (TABS.includes(data.tab)) {
        setSelectedTab(data.tab as typeof TABS[number]);
        setOpen(true);
      }
    });
    return () => unsub();
  }, []);

  /* ======================================================
     COLLAPSED ORB MODE
  ====================================================== */
  if (!open) {
    return (
      <div
        data-nommo-orb
        className="nommoOrb"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: 'var(--orb-size)',
          height: 'var(--orb-size)',
          borderRadius: '50%',
          background: color,
          opacity: 0.9,
          boxShadow: `0 0 14px ${color}`,
          cursor: 'pointer',
          zIndex: 99999,
        }}
        onClick={() => setOpen(true)}
      />
    );
  }

  /* ======================================================
     EXPANDED HUD PANEL
  ====================================================== */
  return (
    <div
      className="nommoDebugHUD"
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: 'var(--hud-width)',
        padding: 'var(--hud-padding)',
        background: 'var(--hud-bg)',
        backdropFilter: `blur(var(--hud-blur))`,
        borderRadius: 'var(--hud-radius)',
        border: '1px solid var(--hud-border)',
        boxShadow: `0 0 20px ${color}33`,
        zIndex: 99999,
        cursor: 'grab',
        color: 'var(--hud-text)',
      }}
      onPointerDown={(e) => {
        const offsetX = e.clientX - pos.x;
        const offsetY = e.clientY - pos.y;

        const move = (ev: PointerEvent) => {
          setPos({ x: ev.clientX - offsetX, y: ev.clientY - offsetY });
        };

        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
    >
      {/* ---------------------- TABS ---------------------- */}
      <div
        className="nommoHUDTabs"
        style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: '6px',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
            background:
                selectedTab === tab ? `${color}33` : 'rgba(255,255,255,0.06)',
            border:
                selectedTab === tab
                ? `1px solid ${color}`
                : '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---------------------- CONTENT ---------------------- */}
      {selectedTab === 'live' && <LiveTab />}

      {selectedTab === 'system' && (
        <>
          <h3 style={{ color }}>System</h3>
          <div className="debugRow"><strong>Route:</strong> {pathname}</div>
          <div className="debugRow">
            <strong>Window:</strong> {windowSize.w} × {windowSize.h}
          </div>
          <div className="debugRow"><strong>Scroll:</strong> {scroll}px</div>
          <div className="debugRow">
            <strong>Clock:</strong> {new Date().toLocaleTimeString()}
          </div>
          <div className="debugRow"><strong>UIMode:</strong> {uiMode}</div>
          <div className="debugRow">
            <strong>Mirror Ray:</strong>
            <span style={{ color }}>{color}</span>
          </div>
          <div className="debugRow">
            <strong>Performance:</strong>
            <span style={{ color }}>{performanceMode.toUpperCase()}</span>
          </div>

          {performanceMode !== 'high' && (
            <PerformanceWarning
              mode={uiMode}
              performanceMode={performanceMode}
            />
          )}
        </>
      )}

      {selectedTab === 'aura' && <AuraDebugPanel embedded />}
      {selectedTab === 'bloom' && <BloomControl embedded />}
      {selectedTab === 'ceremony' && <CeremonyTab />}
      {selectedTab === 'mode' && <ModeTab />}

      {/* Collapse */}
      <button
        style={{
          marginTop: '18px',
          width: '100%',
          padding: '0.5rem 0',
          borderRadius: '8px',
          background: `${color}22`,
          border: `1px solid ${color}55`,
          cursor: 'pointer',
        }}
        onClick={() => setOpen(false)}
      >
        Collapse
      </button>
    </div>
  );
}