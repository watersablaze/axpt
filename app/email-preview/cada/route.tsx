import CadaWelcome from '@/lib/email/templates/CadaWelcome';

export default function Page() {
  return (
    <CadaWelcome
      email="friendofcada@example.com"
      joinedAtISO={new Date().toISOString()}
      heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
      logo="https://www.axpt.io/images/cada/cada-logo.png"
      primaryColor="#000000"
    />
  );
}