'use client';
import { useEffect } from 'react';
import { useMirrorRay } from '@/lib/context/MirrorRayContext';

export default function SetMirrorColor({ color }: { color: 'emerald'|'gold'|'amethyst'|'white' }) {
  const { setColor } = useMirrorRay();
  useEffect(() => { setColor(color); }, [color, setColor]);
  return null;
}