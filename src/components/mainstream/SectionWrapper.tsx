// app/mainstream/page.tsx

import TransmissionStatusBar from "@/src/components/mainstream/TransmissionStatusBar";
import IdentityStatement from "@/src/components/mainstream/IdentityStatement";
import FeaturedTransmission from "@/src/components/mainstream/FeaturedTransmission";
import TransmissionLedger from "@/src/components/mainstream/TransmissionLedger";
import ChannelDirectory from "@/src/components/mainstream/ChannelDirectory";
import UpcomingTransmission from "@/src/components/mainstream/UpcomingTransmission";

export default function MainstreamPage() {
  return (
    <main>
      <TransmissionStatusBar />
      <IdentityStatement />
      <FeaturedTransmission />
      <TransmissionLedger />
      <ChannelDirectory />
      <UpcomingTransmission />
    </main>
  );
}