// app/mainstream/page.tsx

import InstitutionHeader from "@/src/components/mainstream/InstitutionHeader";
import FeaturedTransmission from "@/src/components/mainstream/FeaturedTransmission";
import TransmissionLedger from "@/src/components/mainstream/TransmissionLedger";
import ChannelDirectory from "@/src/components/mainstream/ChannelDirectory";
import UpcomingTransmission from "@/src/components/mainstream/UpcomingTransmission";
import TransmissionGrid from "@/src/components/mainstream/TransmissionGrid";

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