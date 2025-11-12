import NommoHero from '@/components/nommo/NommoHero';
import NommoFeature from '@/components/nommo/NommoFeature';
import NommoBridge from '@/components/nommo/NommoBridge';
import NommoManifesto from '@/components/nommo/NommoManifesto';
import NommoUpcomingBridge from '@/components/nommo/NommoUpcomingBridge';
import NommoUpcoming from '@/components/nommo/NommoUpcoming';

export const metadata = {
  title: 'Nommo Media | AXPT.io',
  description:
    'Restorative storytelling and sacred reportage through film and word.',
};

export default function NommoMediaPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <NommoHero />
      <NommoFeature />
      <NommoManifesto />

      {/* 🌗 Transitional Bridge */}
      <NommoUpcomingBridge />

      <NommoUpcoming />
    </main>
  );
}