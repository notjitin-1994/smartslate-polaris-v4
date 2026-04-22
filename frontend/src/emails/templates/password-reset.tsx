/**
 * Password Reset Email Template
 * Branded recovery instructions with premium Indigo design
 */

import { Text, Button, Section, Row, Column, Img } from '@react-email/components';
import { BaseEmail } from './base';

interface PasswordResetEmailProps {
  userName?: string;
  resetLink: string;
  expiresInHours?: number;
}

export function PasswordResetEmail({
  userName = 'there',
  resetLink,
  expiresInHours = 1,
}: PasswordResetEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartslate.io';
  
  return (
    <BaseEmail preview="Reset your Smartslate Polaris password">
      {/* Premium Header/Logo Area */}
      <Section style={headerSection}>
        <Text style={logoText}>Smartslate</Text>
        <Text style={productBadge}>POLARIS</Text>
      </Section>

      <div style={divider} />

      {/* Recovery Icon */}
      <Section style={iconSection}>
        <div style={iconWrapper}>
          <Text style={keyIcon}>🔐</Text>
        </div>
      </Section>

      <Text style={title}>Reset Your Password</Text>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        We received a request to reset the password for your Smartslate Polaris account. 
        Click the button below to choose a new password and get back to designing.
      </Text>

      {/* Reset Button - Indigo Premium */}
      <Section style={buttonSection}>
        <Button style={primaryButton} href={resetLink}>
          Reset Password
        </Button>
      </Section>

      <Text style={expiryNotice}>
        This secure link will expire in {expiresInHours} hour{expiresInHours > 1 ? 's' : ''}.
      </Text>

      {/* Link fallback */}
      <Section style={fallbackSection}>
        <Text style={fallbackText}>
          If the button doesn't work, copy and paste this URL:
        </Text>
        <Text style={linkText}>{resetLink}</Text>
      </Section>

      <div style={divider} />

      {/* Security Warning */}
      <Section style={securityWarning}>
        <Text style={warningTitle}>Didn't request this change?</Text>
        <Text style={warningText}>
          If you didn't make this request, you can safely ignore this email. 
          Your account remains secure.
        </Text>
      </Section>
    </BaseEmail>
  );
}

// Styles
const headerSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const logoText = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#4f46e5', // Indigo 600
  margin: '0',
  letterSpacing: '-0.5px',
};

const productBadge = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#6366f1', // Indigo 500
  margin: '4px 0 0 0',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
};

const iconSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const iconWrapper = {
  display: 'inline-block',
  padding: '16px',
  backgroundColor: '#eef2ff', // Indigo 50
  borderRadius: '20px',
};

const keyIcon = {
  fontSize: '40px',
  margin: '0',
};

const title = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1e1b4b', // Indigo 950
  marginBottom: '16px',
  textAlign: 'center' as const,
};

const greeting = {
  fontSize: '17px',
  color: '#312e81', // Indigo 900
  marginBottom: '16px',
  textAlign: 'left' as const,
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4338ca', // Indigo 700
  marginBottom: '24px',
  textAlign: 'left' as const,
};

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const primaryButton = {
  backgroundColor: '#4f46e5', // Indigo 600
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '700',
  display: 'inline-block',
  boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
};

const expiryNotice = {
  fontSize: '13px',
  color: '#6366f1', // Indigo 500
  marginBottom: '32px',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
};

const fallbackSection = {
  backgroundColor: '#f5f3ff', // Indigo 50 (slightly different)
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '32px',
  border: '1px dashed #c7d2fe', // Indigo 200
};

const fallbackText = {
  fontSize: '12px',
  color: '#4338ca',
  marginBottom: '8px',
};

const linkText = {
  fontSize: '11px',
  color: '#4f46e5',
  wordBreak: 'break-all' as const,
  textDecoration: 'underline',
};

const divider = {
  height: '1px',
  backgroundColor: '#e0e7ff', // Indigo 100
  margin: '24px 0',
};

const securityWarning = {
  marginTop: '24px',
};

const warningTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e1b4b',
  marginBottom: '4px',
};

const warningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6366f1',
  margin: '0',
};

export default PasswordResetEmail;
