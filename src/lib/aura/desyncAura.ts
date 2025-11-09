// 🌌 Dynamically offsets aura pulse animations for organic drift + persistence
export function applyAuraDesync(enabled: boolean) {
  const root = document.documentElement;

  // 🌀 Store persistent preference
  try {
    localStorage.setItem('auraDesyncEnabled', String(enabled));
  } catch (e) {
    console.warn('⚠️ Aura desync persistence failed:', e);
  }

  // 🎛 Update dataset flag for global selectors
  root.dataset.auraDesync = enabled ? 'true' : 'false';

  // 🎨 Target aura-enabled elements
  const auraElements = document.querySelectorAll<HTMLElement>(
    '.aura-pulse, .sectionButton, header .nav a.active::after'
  );

  auraElements.forEach((el) => {
    const delay = enabled ? Math.random() * 2 : 0; // random 0–2s offset
    el.style.animationDelay = `${delay}s`;
  });

  // 🪶 Visual trace in dev
  if (process.env.NODE_ENV === 'development') {
    console.info(
      `✨ Aura desync ${enabled ? 'activated' : 'disabled'} — ${auraElements.length} elements affected.`
    );
  }
}

// 🌙 Initialize aura state on page load (auto-run)
export function initAuraDesync() {
  try {
    const saved = localStorage.getItem('auraDesyncEnabled');
    const enabled = saved === 'true';
    applyAuraDesync(enabled);
  } catch {
    applyAuraDesync(false);
  }
}