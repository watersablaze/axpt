// src/lib/email/sendCadaNotification.ts
import { resend } from '@/lib/email/resend';
import CadaWelcome from './templates/CadaWelcome';
import { render } from '@react-email/render';

export async function sendCadaNotification(email: string, joinedAtISO: string) {
  try {
    console.log(`[CADA] 📨 Initiating sendCadaNotification for: ${email}`);
    console.log(`[CADA] Timestamp: ${joinedAtISO}`);

    // Render the React Email component into HTML
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

    console.log('[CADA] ✅ Email HTML rendered successfully. Sending via Resend...');

    // Send email through Resend
    const response = await resend.emails.send({
      from: 'noreply@axpt.io',
      to: email,
      subject: 'Welcome to CADA – Diasporic Artistry 2025',
      html,
    });

    console.log('[CADA] 📬 Resend Response:', JSON.stringify(response, null, 2));
    console.log('[CADA] 🎉 Email successfully dispatched!');
  } catch (error: any) {
    console.error('[CADA] ❌ Error while sending email:', error);
    throw error; // Ensure Next.js catches and logs it
  }
}