'use client';
import { useState } from 'react';
import HeroCeremonial from './HeroCeremonial';
import InnerHero from './InnerHero';

export default function SigilGateScene() {
  const [showInner, setShowInner] = useState(false);
  return showInner ? (
    <InnerHero />
  ) : (
    <HeroCeremonial onComplete={() => setShowInner(true)} />
  );
}