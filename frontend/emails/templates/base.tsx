/**
 * Base Email Template
 * Modern Indigo design for all Smartslate Polaris emails
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
  // Ensure we point to the verified domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartslate.io';

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
          {/* Header with Logo and Branding - Indigo Theme */}
          <Section style={header}>
            <Row>
              <Column style={{ width: '100%' }}>
                {/* Branded Logo Fallback (Text-based to avoid broken images) */}
                <div style={logoContainer}>
                  <div style={logoIcon}>S</div>
                </div>
                <Text style={brandText}>
                  Smartslate <span style={polarisText}>Polaris</span>
                </Text>
                <Text style={tagline}>AI-Powered Learning Experience Design</Text>
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
              <Column style={{ width: '100%', textAlign: 'center' as const }}>
                <Text style={footerLinksText}>
                  <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                    Dashboard
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/blueprints`} style={footerLink}>
                    Blueprints
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/support`} style={footerLink}>
                    Support
                  </Link>
                  {' • '}
                  <Link href={`${baseUrl}/privacy`} style={footerLink}>
                    Privacy
                  </Link>
                </Text>
              </Column>
            </Row>

            {/* Company Info */}
            <Row>
              <Column style={{ width: '100%', textAlign: 'center' as const }}>
                <Text style={footerCopyright}>
                  © {currentYear} Smartslate. All rights reserved.
                </Text>
                <Text style={footerUnsubscribe}>
                  You're receiving this because you have a Smartslate account.{' '}
                  <Link href={`${baseUrl}/settings/notifications`} style={unsubscribeLink}>
                    Manage preferences
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

// Styles - Premium Indigo Design
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 20px',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 8px 10px -6px rgba(79, 70, 229, 0.05)',
  border: '1px solid #e0e7ff',
};

const header = {
  background: '#ffffff',
  padding: '40px 48px 20px 48px',
  textAlign: 'center' as const,
};

const logoContainer = {
  display: 'inline-block',
  marginBottom: '16px',
};

const logoIcon = {
  width: '44px',
  height: '44px',
  backgroundColor: '#4f46e5',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800',
  lineHeight: '44px',
  textAlign: 'center' as const,
  margin: '0 auto',
};

const brandText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1e1b4b', // Indigo 950
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
  textAlign: 'center' as const,
};

const polarisText = {
  color: '#4f46e5', // Indigo 600
  fontWeight: '800',
};

const tagline = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#6366f1', // Indigo 500
  margin: '0',
  textAlign: 'center' as const,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

const contentWrapper = {
  padding: '0',
};

const contentInner = {
  padding: '20px 48px 48px 48px',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '32px 48px',
};

const footerDivider = {
  borderColor: '#e0e7ff',
  borderWidth: '1px',
  margin: '0 0 24px 0',
};

const footerLinksText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#4f46e5',
  textDecoration: 'none',
  fontWeight: '600',
};

const footerCopyright = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0 0 4px 0',
  fontWeight: '500',
  textAlign: 'center' as const,
};

const footerUnsubscribe = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#6366f1',
  textDecoration: 'underline',
};

export default BaseEmail;
