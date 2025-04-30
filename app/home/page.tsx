'use client';
import AxisOrbAnimation from './AxisOrbAnimation';
import EnterButton from './EnterButton';
import CompassNav from './CompassNav';

export default function HomePage() {
  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <AxisOrbAnimation />
      <div className="absolute inset-0 flex items-center justify-center">
        <EnterButton />
      </div>
      <CompassNav />
    </div>
  );
}
