import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Tailwind,
  Text,
} from '@react-email/components';

type CadaWelcomeProps = {
  email: string;
  joinedAtISO: string;
  heroImage?: string;
  logo?: string;
  primaryColor?: string;
};

export default function CadaWelcome({
  email,
  joinedAtISO,
  heroImage = 'https://www.axpt.io/emails/assets/cada-bg-palms.png',
  logo = 'https://www.axpt.io/images/cada/cada-logo.png',
  primaryColor = '#000000',
}: CadaWelcomeProps) {
  const joinedDate = new Date(joinedAtISO).toLocaleDateString();
  const flyerUrl = 'https://www.axpt.io/images/cada/cada16Flyer_V2.jpg';

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body
          style={{
            backgroundColor: '#f5f0e6',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            padding: '40px 0',
            fontFamily: 'sans-serif',
            color: '#000',
          }}
        >
          <Container
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              maxWidth: '500px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            {/* ✅ Logo */}
            <Img
              src={logo}
              alt="CADA Logo"
              width="130"
              style={{
                margin: '0 auto 20px',
                display: 'block',
              }}
            />

            <Heading
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '10px',
              }}
            >
              Welcome to CADA
            </Heading>

            <Text style={{ fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
              Thank you for joining the 16th year of Diasporic Artistry. We’re honored to
              have your spirit with us on this journey toward Art Basel Miami 2025.
            </Text>

            <Text style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              Your registered email: {email}
            </Text>

            <Text style={{ fontSize: '14px', marginBottom: '24px' }}>
              Joined: {joinedDate}
            </Text>

            {/* ✅ Embedded Flyer */}
            <Img
              src={flyerUrl}
              alt="CADA 16 Flyer"
              width="480"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            />

            {/* ✅ Download Flyer Button */}
            <Button
              href={flyerUrl}
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Download the Flyer
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}