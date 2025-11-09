'use client';

import { useEffect } from 'react';
import { initAuraDesync } from '@/lib/aura/desyncAura';

export default function AuraInitializer() {
  useEffect(() => {
    initAuraDesync();
  }, []);

  return null; // nothing visible, just runs the effect
}