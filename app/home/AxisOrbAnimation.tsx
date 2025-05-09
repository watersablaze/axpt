'use client';
export default function AxisOrbAnimation() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
    >
      <source src="/animations/Axis_Orb2.webm" type="video/webm" />
    </video>
  );
}
