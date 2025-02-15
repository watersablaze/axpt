"use client";

import { useEffect, useCallback } from "react";
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";

export default function ParticlesBackground() {
  const particlesInit = useCallback(async (engine: any) => {
    console.log("Initializing tsParticles...", engine); // ✅ Debug log to check if it's running
    await loadFull(engine);
  }, []);

  return (
    <div
      style={{
        background: "red",
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 10,
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit} // ✅ Correctly passing useCallback function
        options={{
          fullScreen: { enable: true },
          particles: {
            number: { value: 60 },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.7 },
            size: { value: 2 },
            move: { enable: true, speed: 1 },
          },
          interactivity: {
            events: { onHover: { enable: true, mode: "repulse" } },
            modes: { repulse: { distance: 100 } },
          },
        }}
      />
    </div>
  );
}