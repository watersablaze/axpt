// src/lib/email/sendAxisConfirmation.ts
import React from 'react';
import { resend } from '@/lib/email/client';
import AxisConfirmationEmail from './templates/AxisConfirmationEmail';
import { logEmailEvent } from './logEmailEvent';

export async function sendAxisConfirmation(email: string, joinedAtISO: string) {
  try {
    const response = await resend.emails.send({
      from: 'AXPT <connect@axpt.io>',
      to: email,
      subject: 'Welcome to the Axis Journey',
      react: React.createElement(AxisConfirmationEmail, {
        email,
        joinedAtISO,
      }),
    });

    console.log(`✅ Axis confirmation sent to: ${email}`);

    // Log the event manually (until webhook is active)
    await logEmailEvent({
      type: 'email.sent',
      to: email,
      from: 'connect@axpt.io',
      subject: 'Welcome to the Axis Journey',
      messageId: response?.data?.id ?? '',
      status: 'sent',
      eventRaw: response,
    });
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err);
  }
}