'use client';

import CadaWelcomeEmail from '@/lib/email/templates/CadaWelcome';
import EmailPreviewLayout from '@/components/EmailPreviewLayout';

export default function CadaEmailTestPage() {
  return (
    <EmailPreviewLayout
      title="CADA Welcome Email"
      bgColor="#fffaf0"
      textColor="#000000"
    >
      <div className="relative">
        {/* ✅ Palm — Positioned bottom right */}
        <img
          src="/images/cada/cada-palms.png"
          alt="Palm Visual"
          width={300}
          height={300}
          className="absolute bottom-0 right-0 z-0 opacity-80 pointer-events-none select-none"
        />

        {/* ✅ CADA Logo */}
        <div className="flex justify-center mt-8 mb-4 relative z-10">
          <img
            src="/images/cada/cada-logo.png"
            alt="CADA Logo"
            width={180}
            height={90}
          />
        </div>

        {/* ✅ Email Preview Content */}
        <div className="relative z-10">
        <CadaWelcomeEmail
          email="you@example.com"
          joinedAtISO={new Date().toISOString()}
          heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
          logo="https://www.axpt.io/images/cada/cada-logo.png"
          primaryColor="#000000"
        />
        </div>
      </div>
    </EmailPreviewLayout>
  );
}