import * as React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Img, Link } from '@react-email/components';

export default function CadaAnniversary({
  heroImage = 'https://YOUR-CDN/cada-anniversary.jpg',
  primaryColor = '#E6C667',
}: { heroImage?: string; primaryColor?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Celebrating 16 Years of CADA — Where Art Meets Legacy</Preview>
      <Body style={{ background: '#0e0e0e', margin: 0 }}>
        <Container style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
          <Section style={{ textAlign: 'center' }}>
            <Img src={heroImage} width={640} height={240} alt="CADA 16 Years" style={{ borderRadius: 12 }} />
          </Section>

          <Section style={{ background: '#141414', borderRadius: 12, padding: 24 }}>
            <Heading as="h1" style={{ color: primaryColor, fontSize: 28, marginBottom: 12 }}>
              ✨ CADA — 16 Years of Diasporic Artistry
            </Heading>
            <Text style={{ color: '#dcdcdc', lineHeight: '24px', fontSize: 16 }}>
              This season marks sixteen years of collective brilliance. From the studios of Florida to the galleries
              of Accra, our community has turned heritage into momentum.
            </Text>
            <Text style={{ color: '#bfbfbf', lineHeight: '22px', fontSize: 14, marginTop: 16 }}>
              Thank you for being part of the continuum.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: 20 }}>
              <Link
                href="https://axpt.io"
                style={{
                  display: 'inline-block',
                  padding: '12px 18px',
                  backgroundColor: primaryColor,
                  color: '#0e0e0e',
                  borderRadius: 8,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Visit AXPT.io →
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}