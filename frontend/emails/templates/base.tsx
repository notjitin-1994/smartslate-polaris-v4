/**
 * Base Email Template
 * Modern glassmorphism design for all SmartSlate Polaris emails
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Img,
  Hr,
  Row,
  Column,
  Font,
} from '@react-email/components';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  const currentYear = new Date().getFullYear();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo and Branding */}
          <Section style={header}>
            <Row>
              <Column style={{ width: '100%' }}>
                <Img
                  src={`${baseUrl}/logo-swirl.png`}
                  width="60"
                  height="60"
                  alt="SmartSlate Polaris"
                  style={logoStyle}
                />
                <Text style={brandText}>
                  SmartSlate <span style={polarisText}>Polaris</span>
                </Text>
                <Text style={tagline}>AI-Powered Learning Blueprint Generation</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content Area */}
          <Section style={contentWrapper}>
            <div style={contentInner}>{children}</div>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Hr style={footerDivider} />

            {/* Footer Links */}
            <Row style={{ marginBottom: '20px' }}>
              <Column style={{ width: '100%', textAlign: 'left' as const }}>
                <Text style={footerLinksText}>
                  <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                    Dashboard
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/blueprints`} style={footerLink}>
                    My Blueprints
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/support`} style={footerLink}>
                    Support Center
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/privacy`} style={footerLink}>
                    Privacy Policy
                  </Link>
                </Text>
              </Column>
            </Row>

            {/* Company Info */}
            <Row>
              <Column style={{ width: '100%', textAlign: 'left' as const }}>
                <Text style={footerCopyright}>
                  © {currentYear} SmartSlate Technologies. All rights reserved.
                </Text>
                <Text style={footerAddress}>
                  Transforming learning through intelligent blueprint generation
                </Text>
                <Text style={footerUnsubscribe}>
                  You're receiving this email because you have an account with SmartSlate Polaris.{' '}
                  <Link href={`${baseUrl}/settings/notifications`} style={unsubscribeLink}>
                    Manage email preferences
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles - Modern glassmorphism design
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 20px',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const header = {
  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  padding: '40px 48px',
  textAlign: 'left' as const,
};

const logoStyle = {
  marginBottom: '16px',
  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
};

const brandText = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#000000',
  margin: '0 0 8px 0',
  letterSpacing: '-0.5px',
  textAlign: 'left' as const,
};

const polarisText = {
  color: '#134e4a',
  fontWeight: '800',
};

const tagline = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#0f766e',
  margin: '0',
  textAlign: 'left' as const,
  letterSpacing: '0.025em',
};

const contentWrapper = {
  padding: '0',
};

const contentInner = {
  padding: '32px 48px',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '32px 48px',
};

const footerDivider = {
  borderColor: '#e2e8f0',
  borderWidth: '1px',
  margin: '0 0 24px 0',
};

const footerLinksText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0 0 8px 0',
  textAlign: 'left' as const,
};

const footerLink = {
  color: '#14b8a6',
  textDecoration: 'none',
  fontWeight: '500',
};

const footerCopyright = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0 0 4px 0',
  fontWeight: '500',
  textAlign: 'left' as const,
};

const footerAddress = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0 0 12px 0',
  fontStyle: 'italic',
  textAlign: 'left' as const,
};

const footerUnsubscribe = {
  fontSize: '12px',
  color: '#94a3b8',
  lineHeight: '18px',
  margin: '0',
  textAlign: 'left' as const,
};

const unsubscribeLink = {
  color: '#14b8a6',
  textDecoration: 'underline',
  fontWeight: '500',
};

export default BaseEmail;
