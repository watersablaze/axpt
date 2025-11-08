'use client';

import { Html } from '@react-email/html';
import AxisConfirmationEmail from '@/lib/email/templates/AxisConfirmationEmail';

export default function PreviewAxisEmailPage() {
  return (
    <Html lang="en">
      <AxisConfirmationEmail
        email="connect@axpt.io"
        joinedAtISO={new Date().toISOString()}
        siteName="AXPT.io"
      />
    </Html>
  );
}