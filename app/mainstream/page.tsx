// app/mainstream/page.tsx

import InstitutionHeader from "@/components/mainstream/InstitutionHeader";
import FeaturedTransmission from "@/components/mainstream/FeaturedTransmission";
import TransmissionLedger from "@/components/mainstream/TransmissionLedger";
import ChannelDirectory from "@/components/mainstream/ChannelDirectory";
import UpcomingTransmission from "@/components/mainstream/UpcomingTransmission";
import TransmissionGrid from "@/components/mainstream/TransmissionGrid";

export default function MainstreamPage() {
  return (
    <main>
      <InstitutionHeader />
      <FeaturedTransmission />
      <TransmissionGrid />
      <TransmissionLedger />
      <ChannelDirectory />
      <UpcomingTransmission />
    </main>
  );
}