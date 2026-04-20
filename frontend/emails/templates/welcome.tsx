/**
 * Welcome Email Template
 * Onboarding-focused design with getting started guide
 */

import { Text, Button, Section, Row, Column } from '@react-email/components';
import { BaseEmail } from './base';

interface WelcomeEmailProps {
  userName?: string;
  userEmail: string;
  subscriptionTier?: string;
  blueprintLimit?: number;
}

export function WelcomeEmail({
  userName = 'there',
  userEmail,
  subscriptionTier = 'Explorer',
  blueprintLimit = 2,
}: WelcomeEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';
  const tierDisplayName =
    subscriptionTier === 'explorer'
      ? 'Free Tier Member'
      : `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Member`;

  return (
    <BaseEmail preview="Welcome to SmartSlate Polaris - Your AI-powered learning journey begins!">
      {/* Welcome Hero Section */}
      <Section style={heroSection}>
        <div style={heroIconWrapper}>
          <Text style={heroIcon}>🎉</Text>
        </div>
        <Text style={heroTitle}>Welcome to SmartSlate Polaris!</Text>
        <Text style={heroSubtitle}>Your personalized learning journey starts here</Text>
      </Section>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        Congratulations on taking the first step towards transforming your learning experience!
        SmartSlate Polaris uses cutting-edge AI technology to create personalized learning
        blueprints tailored to your unique goals and needs.
      </Text>

      {/* Account Status Card */}
      <Section style={statusCard}>
        <Row>
          <Column style={{ width: '100%' }}>
            <Text style={statusTitle}>Your Account Details</Text>
            <div style={statusRow}>
              <Text style={statusLabel}>Email</Text>
              <Text style={statusValue}>{userEmail}</Text>
            </div>
            <div style={statusRow}>
              <Text style={statusLabel}>Membership</Text>
              <Text style={statusValueHighlight}>{tierDisplayName}</Text>
            </div>
            <div style={statusRow}>
              <Text style={statusLabel}>Monthly Blueprint Limit</Text>
              <Text style={statusValue}>{blueprintLimit} blueprints</Text>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Getting Started Section */}
      <Section style={gettingStartedSection}>
        <Text style={sectionTitle}>🚀 Getting Started in 3 Simple Steps</Text>

        <div style={stepNumber}>1</div>
        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>📝</Text>
            </Column>
            <Column style={{ paddingLeft: '16px' }}>
              <Text style={stepTitle}>Complete the Initial Questionnaire</Text>
              <Text style={stepDescription}>
                Answer 30+ targeted questions about your learning goals, background, and
                preferences. This takes about 10-15 minutes and helps our AI understand your unique
                needs.
              </Text>
              <Button style={stepButton} href={`${baseUrl}/questionnaire/static`}>
                Start Questionnaire →
              </Button>
            </Column>
          </Row>
        </div>

        <div style={stepNumber}>2</div>
        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>🤖</Text>
            </Column>
            <Column style={{ paddingLeft: '16px' }}>
              <Text style={stepTitle}>Answer AI-Generated Dynamic Questions</Text>
              <Text style={stepDescription}>
                Based on your initial responses, our AI will generate 50-70 personalized follow-up
                questions across 10 sections to dive deeper into your specific requirements.
              </Text>
            </Column>
          </Row>
        </div>

        <div style={stepNumber}>3</div>
        <div style={stepCard}>
          <Row>
            <Column style={{ width: '48px', verticalAlign: 'top' }}>
              <Text style={stepIcon}>📘</Text>
            </Column>
            <Column style={{ paddingLeft: '16px' }}>
              <Text style={stepTitle}>Receive Your Custom Learning Blueprint</Text>
              <Text style={stepDescription}>
                Get a comprehensive, personalized learning roadmap with resources, timelines, and
                actionable steps. Export it as PDF, Word, or Markdown for easy reference.
              </Text>
            </Column>
          </Row>
        </div>
      </Section>

      {/* Primary CTA */}
      <Section style={ctaSection}>
        <Button style={primaryCTA} href={`${baseUrl}/dashboard`}>
          Go to Your Dashboard
        </Button>
      </Section>

      {/* Features Highlight */}
      <Section style={featuresSection}>
        <Text style={featuresTitle}>What Makes SmartSlate Polaris Special</Text>

        <Row style={featureRow}>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <div style={featureCard}>
              <Text style={featureEmoji}>🧠</Text>
              <Text style={featureCardTitle}>Gemini AI Integration</Text>
              <Text style={featureCardText}>
                Powered by Anthropic's Gemini AI for intelligent, context-aware blueprint generation
                with dual-fallback architecture for reliability.
              </Text>
            </div>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <div style={featureCard}>
              <Text style={featureEmoji}>📊</Text>
              <Text style={featureCardTitle}>Two-Phase System</Text>
              <Text style={featureCardText}>
                Static questionnaire followed by dynamic AI-generated questions ensures
                comprehensive understanding of your needs.
              </Text>
            </div>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <div style={featureCard}>
              <Text style={featureEmoji}>🎯</Text>
              <Text style={featureCardTitle}>Personalized Roadmaps</Text>
              <Text style={featureCardText}>
                Each blueprint is uniquely tailored to your goals, timeline, budget, and learning
                style with actionable steps.
              </Text>
            </div>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <div style={featureCard}>
              <Text style={featureEmoji}>📁</Text>
              <Text style={featureCardTitle}>Multiple Export Options</Text>
              <Text style={featureCardText}>
                Download your blueprints in PDF, Word, or Markdown format. Share them via secure
                links with colleagues or mentors.
              </Text>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Tips Section */}
      <Section style={tipsSection}>
        <Text style={tipsTitle}>💡 Pro Tips for Best Results</Text>
        <ul style={tipsList}>
          <li style={tipItem}>
            Be as specific as possible when answering questionnaires - the more detail you provide,
            the more personalized your blueprint will be
          </li>
          <li style={tipItem}>
            Take your time with the dynamic questions - they're designed to uncover insights you
            might not have considered
          </li>
          <li style={tipItem}>
            Save your blueprints regularly - your {tierDisplayName} plan allows {blueprintLimit}{' '}
            blueprints per month
          </li>
          <li style={tipItem}>
            Use the feedback feature to help us improve the platform for everyone
          </li>
        </ul>
      </Section>

      {/* Support Section */}
      <Section style={supportSection}>
        <Row>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <Button style={secondaryButton} href={`${baseUrl}/help`}>
              View Help Center
            </Button>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <Button style={tertiaryButton} href={`${baseUrl}/support`}>
              Contact Support
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Upgrade Prompt for Free Tier */}
      {subscriptionTier.toLowerCase() === 'explorer' && (
        <Section style={upgradeSection}>
          <Row>
            <Column style={{ width: '40px', verticalAlign: 'top' }}>
              <Text style={upgradeIcon}>⚡</Text>
            </Column>
            <Column style={{ paddingLeft: '12px' }}>
              <Text style={upgradeTitle}>Want More Blueprints?</Text>
              <Text style={upgradeText}>
                Upgrade to Navigator or higher for more monthly blueprints, priority support, and
                advanced features.
              </Text>
              <a href={`${baseUrl}/pricing`} style={upgradeLink}>
                View Pricing Plans →
              </a>
            </Column>
          </Row>
        </Section>
      )}

      {/* Footer Note */}
      <Section style={footerSection}>
        <Text style={footerNote}>
          We're excited to have you as part of the SmartSlate Polaris community! Your learning
          transformation journey begins now. 🚀
        </Text>
      </Section>
    </BaseEmail>
  );
}

// Styles
const heroSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  paddingBottom: '24px',
  borderBottom: '2px solid #f0fdfa',
};

const heroIconWrapper = {
  display: 'inline-block',
  marginBottom: '16px',
};

const heroIcon = {
  fontSize: '64px',
  margin: '0',
};

const heroTitle = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: '8px',
  letterSpacing: '-1px',
};

const heroSubtitle = {
  fontSize: '16px',
  color: '#14b8a6',
  margin: '0',
  fontWeight: '500',
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

const statusCard = {
  backgroundColor: '#f0fdfa',
  border: '2px solid #14b8a6',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const statusTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#134e4a',
  marginBottom: '20px',
  textAlign: 'left' as const,
};

const statusRow = {
  display: 'flex',
  justifyContent: 'space-between',
  paddingBottom: '12px',
  marginBottom: '12px',
  borderBottom: '1px solid #ccfbf1',
};

const statusLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  textAlign: 'left' as const,
};

const statusValue = {
  fontSize: '15px',
  color: '#1e293b',
  fontWeight: '500',
  textAlign: 'right' as const,
};

const statusValueHighlight = {
  fontSize: '15px',
  color: '#0d9488',
  fontWeight: '600',
  textAlign: 'right' as const,
};

const gettingStartedSection = {
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '24px',
  textAlign: 'left' as const,
};

const stepNumber = {
  display: 'inline-block',
  width: '28px',
  height: '28px',
  backgroundColor: '#14b8a6',
  color: '#ffffff',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '28px',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '16px',
};

const stepCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px',
  borderLeft: '4px solid #14b8a6',
};

const stepIcon = {
  fontSize: '28px',
  margin: '0',
};

const stepTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const stepDescription = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#64748b',
  marginBottom: '16px',
  textAlign: 'left' as const,
};

const stepButton = {
  backgroundColor: '#14b8a6',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  display: 'inline-block',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const primaryCTA = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '16px 48px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
};

const featuresSection = {
  marginBottom: '32px',
};

const featuresTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const featureRow = {
  marginBottom: '16px',
};

const featureCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  height: '100%',
};

const featureEmoji = {
  fontSize: '32px',
  marginBottom: '12px',
  display: 'block',
};

const featureCardTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const featureCardText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#475569',
  margin: '0',
  textAlign: 'left' as const,
};

const tipsSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#14532d',
  marginBottom: '16px',
  textAlign: 'left' as const,
};

const tipsList = {
  margin: '0',
  paddingLeft: '20px',
};

const tipItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#166534',
  marginBottom: '12px',
  textAlign: 'left' as const,
};

const supportSection = {
  marginBottom: '32px',
};

const secondaryButton = {
  display: 'block',
  backgroundColor: '#ffffff',
  color: '#14b8a6',
  padding: '14px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  textAlign: 'center' as const,
  border: '2px solid #14b8a6',
  width: '100%',
};

const tertiaryButton = {
  display: 'block',
  backgroundColor: '#f8fafc',
  color: '#475569',
  padding: '14px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  textAlign: 'center' as const,
  border: '2px solid #e2e8f0',
  width: '100%',
};

const upgradeSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '32px',
};

const upgradeIcon = {
  fontSize: '24px',
  margin: '0',
};

const upgradeTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#92400e',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const upgradeText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#b45309',
  marginBottom: '12px',
  textAlign: 'left' as const,
};

const upgradeLink = {
  color: '#6366f1',
  fontWeight: '600',
  textDecoration: 'none',
  fontSize: '14px',
};

const footerSection = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
  marginTop: '32px',
};

const footerNote = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#64748b',
  margin: '0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
};

export default WelcomeEmail;
