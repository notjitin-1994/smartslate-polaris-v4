/**
 * Password Changed Email Template
 * Security notification with modern design
 */

import { Text, Button, Section, Row, Column, Img } from '@react-email/components';
import { BaseEmail } from './base';

interface PasswordChangedEmailProps {
  userName?: string;
  changedAt: string;
  ipAddress?: string;
  location?: string;
  device?: string;
}

export function PasswordChangedEmail({
  userName = 'there',
  changedAt,
  ipAddress,
  location,
  device,
}: PasswordChangedEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';

  return (
    <BaseEmail preview="Your SmartSlate Polaris password has been changed">
      {/* Security Icon and Title */}
      <Section style={iconSection}>
        <div style={iconWrapper}>
          <Text style={lockIcon}>🔐</Text>
        </div>
      </Section>

      <Text style={title}>Password Successfully Changed</Text>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        Your SmartSlate Polaris account password was successfully updated. This change ensures your
        learning blueprints and personal data remain secure.
      </Text>

      {/* Security Details Card */}
      <Section style={securityCard}>
        <Row>
          <Column style={{ width: '100%' }}>
            <Text style={securityTitle}>Security Information</Text>

            <div style={detailRow}>
              <Text style={detailLabel}>Date & Time</Text>
              <Text style={detailValue}>
                {new Date(changedAt).toLocaleString('en-US', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </Text>
            </div>

            {ipAddress && (
              <div style={detailRow}>
                <Text style={detailLabel}>IP Address</Text>
                <Text style={detailValue}>{ipAddress}</Text>
              </div>
            )}

            {location && (
              <div style={detailRow}>
                <Text style={detailLabel}>Location</Text>
                <Text style={detailValue}>{location}</Text>
              </div>
            )}

            {device && (
              <div style={detailRow}>
                <Text style={detailLabel}>Device</Text>
                <Text style={detailValue}>{device}</Text>
              </div>
            )}
          </Column>
        </Row>
      </Section>

      {/* Warning Section */}
      <Section style={warningSection}>
        <Row>
          <Column style={{ width: '48px', verticalAlign: 'top' }}>
            <Text style={warningIcon}>⚠️</Text>
          </Column>
          <Column style={{ paddingLeft: '12px' }}>
            <Text style={warningTitle}>Didn't make this change?</Text>
            <Text style={warningText}>
              If you didn't change your password, your account may be compromised. Please secure
              your account immediately.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* CTA Buttons */}
      <Section style={buttonSection}>
        <Row>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <Button style={primaryButton} href={`${baseUrl}/account/security`}>
              Review Security Settings
            </Button>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <Button style={secondaryButton} href={`${baseUrl}/support`}>
              Contact Support
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Security Tips */}
      <Section style={tipsSection}>
        <Text style={tipsTitle}>Security Best Practices</Text>
        <ul style={tipsList}>
          <li style={tipItem}>Use a unique password for SmartSlate Polaris</li>
          <li style={tipItem}>Enable two-factor authentication for extra security</li>
          <li style={tipItem}>Never share your password with anyone</li>
          <li style={tipItem}>Update your password every 90 days</li>
        </ul>
      </Section>
    </BaseEmail>
  );
}

// Styles
const iconSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const iconWrapper = {
  display: 'inline-block',
  padding: '16px',
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
};

const lockIcon = {
  fontSize: '48px',
  margin: '0',
};

const title = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: '8px',
  textAlign: 'left' as const,
  letterSpacing: '-0.5px',
};

const greeting = {
  fontSize: '17px',
  color: '#334155',
  marginBottom: '16px',
  textAlign: 'left' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#475569',
  marginBottom: '24px',
  textAlign: 'left' as const,
};

const securityCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const securityTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '16px',
  textAlign: 'left' as const,
};

const detailRow = {
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const detailValue = {
  fontSize: '15px',
  color: '#1e293b',
  margin: '0',
  textAlign: 'left' as const,
};

const warningSection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '24px',
};

const warningIcon = {
  fontSize: '24px',
  margin: '0',
};

const warningTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#991b1b',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const warningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#b91c1c',
  margin: '0',
  textAlign: 'left' as const,
};

const buttonSection = {
  marginBottom: '32px',
};

const primaryButton = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '14px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  display: 'block',
  textAlign: 'center' as const,
  width: '100%',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  color: '#14b8a6',
  padding: '14px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  display: 'block',
  textAlign: 'center' as const,
  border: '2px solid #14b8a6',
  width: '100%',
};

const tipsSection = {
  backgroundColor: '#f0fdfa',
  borderRadius: '12px',
  padding: '20px',
  marginTop: '32px',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#134e4a',
  marginBottom: '12px',
  textAlign: 'left' as const,
};

const tipsList = {
  margin: '0',
  paddingLeft: '20px',
};

const tipItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#0d9488',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

export default PasswordChangedEmail;
