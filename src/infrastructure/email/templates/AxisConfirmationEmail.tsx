import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

type AxisConfirmationEmailProps = {
  email: string;
  joinedAtISO: string;
};

export default function AxisConfirmationEmail({
  email,
  joinedAtISO,
}: AxisConfirmationEmailProps) {
  const formattedDate = new Date(joinedAtISO).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>You've been entered into the Axis Journey ledger.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            {/* Placeholder sigil logo */}
            <Img src="https://www.axpt.io/images/sigil/axpt-sigil-mark.png" alt="AXPT Sigil" width="80" />
          </Section>

          <Heading as="h1" style={styles.heading}>
            Welcome to the Axis Point
          </Heading>

          <Text style={styles.paragraph}>Greetings,</Text>

          <Text style={styles.paragraph}>
            Your email <Link href={`mailto:${email}`}>{email}</Link> has been successfully received into the <b>Axis Journey ledger</b> on <b>{formattedDate}</b>.
          </Text>

          <Text style={styles.paragraph}>
            As we enter the ceremonial web of sustainable cultural finance, you’ll begin receiving insights, exclusive invitations, and tools designed for decentralized innovation and regenerative stewardship.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            🌐 Powered by <Link href="https://www.axpt.io">AXPT.io</Link> — Custodians of the Axis
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    padding: '40px 0',
  },
  container: {
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  },
  logoSection: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  heading: {
    color: '#00BFFF',
    fontSize: '24px',
    textAlign: 'center' as const,
    margin: '20px 0',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  footer: {
    color: '#888888',
    fontSize: '13px',
    textAlign: 'center' as const,
    marginTop: '30px',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #333333',
    margin: '30px 0',
  },
};