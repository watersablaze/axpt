// Dynamically offsets aura pulse animations for organic drift
export function applyAuraDesync(enabled: boolean) {
  const root = document.documentElement;
  const auraElements = document.querySelectorAll(
    '.aura-pulse, .sectionButton, header .nav a.active::after'
  );

  auraElements.forEach((el) => {
    const delay = enabled ? Math.random() * 2 : 0; // random 0–2s offset
    (el as HTMLElement).style.animationDelay = `${delay}s`;
  });

  root.dataset.auraDesync = enabled ? 'true' : 'false';
}