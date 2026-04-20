/**
 * Email Verification Template
 * Clean, action-focused design with clear CTA
 */

import { Text, Button, Section, Row, Column } from '@react-email/components';
import { BaseEmail } from './base';

interface VerificationEmailProps {
  userName?: string;
  verificationUrl: string;
  expiresInHours?: number;
}

export function VerificationEmail({
  userName = 'there',
  verificationUrl,
  expiresInHours = 24,
}: VerificationEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';

  return (
    <BaseEmail preview="Verify your Smartslate Polaris account">
      {/* Welcome Icon */}
      <Section style={iconSection}>
        <div style={iconWrapper}>
          <Text style={verifyIcon}>✉️</Text>
        </div>
      </Section>

      <Text style={title}>Verify Your Email Address</Text>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        Welcome to Smartslate Polaris! You're just one step away from accessing AI-powered learning
        blueprint generation. Please verify your email address to get started.
      </Text>

      {/* Main CTA Button */}
      <Section style={ctaSection}>
        <Button style={verifyButton} href={verificationUrl}>
          Verify Email Address
        </Button>
        <Text style={ctaHelper}>Click the button above to confirm your email address</Text>
      </Section>

      {/* What Happens Next Section */}
      <Section style={nextStepsSection}>
        <Text style={sectionTitle}>What happens after verification?</Text>

        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>🎯</Text>
            </Column>
            <Column style={{ paddingLeft: '12px' }}>
              <Text style={stepTitle}>Complete Your Profile</Text>
              <Text style={stepDescription}>
                Add your learning preferences and goals to personalize your experience
              </Text>
            </Column>
          </Row>
        </div>

        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>📋</Text>
            </Column>
            <Column style={{ paddingLeft: '12px' }}>
              <Text style={stepTitle}>Start Your First Questionnaire</Text>
              <Text style={stepDescription}>
                Answer targeted questions to help our AI understand your learning needs
              </Text>
            </Column>
          </Row>
        </div>

        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>🚀</Text>
            </Column>
            <Column style={{ paddingLeft: '12px' }}>
              <Text style={stepTitle}>Generate Your First Blueprint</Text>
              <Text style={stepDescription}>
                Get a personalized learning roadmap tailored to your specific goals
              </Text>
            </Column>
          </Row>
        </div>
      </Section>

      {/* Features Preview */}
      <Section style={featuresSection}>
        <Text style={featuresTitle}>What You'll Get Access To</Text>
        <Row>
          <Column style={{ width: '31%', paddingRight: '2%' }}>
            <div style={featureCard}>
              <Text style={featureIcon}>🤖</Text>
              <Text style={featureTitle}>AI-Powered</Text>
              <Text style={featureText}>Gemini AI generates personalized blueprints</Text>
            </div>
          </Column>
          <Column style={{ width: '31%', padding: '0 2%' }}>
            <div style={featureCard}>
              <Text style={featureIcon}>📊</Text>
              <Text style={featureTitle}>Dynamic Questions</Text>
              <Text style={featureText}>Adaptive questionnaires for better insights</Text>
            </div>
          </Column>
          <Column style={{ width: '31%', paddingLeft: '2%' }}>
            <div style={featureCard}>
              <Text style={featureIcon}>📁</Text>
              <Text style={featureTitle}>Multiple Formats</Text>
              <Text style={featureText}>Export blueprints as PDF, Word, or Markdown</Text>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Expiry Warning */}
      <Section style={warningSection}>
        <Row>
          <Column style={{ width: '40px', verticalAlign: 'top' }}>
            <Text style={warningIcon}>⏰</Text>
          </Column>
          <Column style={{ paddingLeft: '12px' }}>
            <Text style={warningTitle}>Link Expires Soon</Text>
            <Text style={warningText}>
              This verification link will expire in {expiresInHours} hours. If it expires, you can
              request a new one from the login page.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Alternative Action */}
      <Section style={alternativeSection}>
        <Text style={alternativeTitle}>Trouble with the button?</Text>
        <Text style={alternativeText}>Copy and paste this link into your browser:</Text>
        <div style={urlBox}>
          <Text style={urlText}>{verificationUrl}</Text>
        </div>
      </Section>

      {/* Security Notice */}
      <Section style={securitySection}>
        <Text style={securityText}>
          🔒 If you didn't create an account on Smartslate Polaris, you can safely ignore this
          email. Someone may have entered your email address by mistake.
        </Text>
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
  backgroundColor: '#f0fdfa',
  borderRadius: '12px',
};

const verifyIcon = {
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
  marginBottom: '32px',
  textAlign: 'left' as const,
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const verifyButton = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '16px 48px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
};

const ctaHelper = {
  fontSize: '13px',
  color: '#64748b',
  marginTop: '12px',
  textAlign: 'center' as const,
};

const nextStepsSection = {
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '20px',
  textAlign: 'left' as const,
};

const stepCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '12px',
};

const stepIcon = {
  fontSize: '24px',
  margin: '0',
};

const stepTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const stepDescription = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0',
  textAlign: 'left' as const,
};

const featuresSection = {
  backgroundColor: '#f0fdfa',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const featuresTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#134e4a',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const featureCard = {
  textAlign: 'center' as const,
};

const featureIcon = {
  fontSize: '32px',
  marginBottom: '8px',
  display: 'block',
};

const featureTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0d9488',
  marginBottom: '4px',
};

const featureText = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#14b8a6',
  margin: '0',
};

const warningSection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '24px',
};

const warningIcon = {
  fontSize: '20px',
  margin: '0',
};

const warningTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#92400e',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const warningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#b45309',
  margin: '0',
  textAlign: 'left' as const,
};

const alternativeSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '24px',
};

const alternativeTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#334155',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const alternativeText = {
  fontSize: '14px',
  color: '#64748b',
  marginBottom: '12px',
  textAlign: 'left' as const,
};

const urlBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px',
  wordBreak: 'break-all' as const,
};

const urlText = {
  fontSize: '13px',
  color: '#14b8a6',
  margin: '0',
  fontFamily: 'monospace',
  textAlign: 'left' as const,
};

const securitySection = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
  marginTop: '32px',
};

const securityText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0',
  textAlign: 'center' as const,
};

export default VerificationEmail;
