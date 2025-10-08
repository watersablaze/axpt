import { render } from '@react-email/render';
import CadaWelcome from './templates/CadaWelcome';
import { resend } from './resend';

export async function sendCadaNotification(email: string, joinedAtISO: string) {
  const html = render(<CadaWelcome email={email} joinedAtISO={joinedAtISO} />);

  return await resend.emails.send({
    from: 'noreply@axpt.io',
    to: email,
    subject: 'Welcome to CADA – Diasporic Artistry 2025',
    html,
  });
}