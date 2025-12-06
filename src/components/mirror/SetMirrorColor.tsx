'use client';

import { useMirrorRay } from "@/lib/context/MirrorRayContext";

export default function SetMirrorColor() {
  const { setColor } = useMirrorRay();

  return (
    <button
      onClick={() => setColor("#00ffbf")}
      className="btnPrimary"
    >
      Set Mirror Color
    </button>
  );
}