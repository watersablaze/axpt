import { resend } from '@/lib/email/resend';
import CadaWelcome from './templates/CadaWelcome';
import { render } from '@react-email/render';

export async function sendCadaNotification(email: string, joinedAtISO: string) {
  const html = await render(
    <CadaWelcome
      email={email}
      joinedAtISO={joinedAtISO}
      heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
      logo="https://www.axpt.io/images/cada/cada-logo.png"
      primaryColor="#000000"
    />,
    { pretty: true }
  );

  await resend.emails.send({
    from: 'noreply@axpt.io',
    to: email,
    subject: 'Welcome to CADA – Diasporic Artistry 2025',
    html, // ✅ Now guaranteed to be a string
  });
}