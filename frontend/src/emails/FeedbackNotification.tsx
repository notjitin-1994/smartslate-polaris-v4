/**
 * Feedback Notification Email Template
 * Admin notification for user feedback submissions
 * Modern design with clear data presentation
 */

import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Row,
  Column,
  Font,
} from '@react-email/components';

interface FeedbackNotificationProps {
  feedbackId: string;
  userId: string;
  userEmail: string;
  sentiment: string;
  category: string;
  message: string;
  contactEmail?: string;
  timestamp: string;
}

export default function FeedbackNotification({
  feedbackId,
  userId,
  userEmail,
  sentiment,
  category,
  message,
  contactEmail,
  timestamp,
}: FeedbackNotificationProps) {
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const sentimentConfig = {
    positive: {
      emoji: '😊',
      color: '#10b981',
      bg: '#f0fdf4',
      label: 'Positive Feedback',
    },
    neutral: {
      emoji: '😐',
      color: '#f59e0b',
      bg: '#fef3c7',
      label: 'Neutral Feedback',
    },
    negative: {
      emoji: '😞',
      color: '#ef4444',
      bg: '#fee2e2',
      label: 'Negative Feedback',
    },
  };

  const config =
    sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
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
      <Preview>
        New {sentiment} feedback received from {userEmail}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Sentiment Indicator */}
          <Section style={header}>
            <div style={{ ...sentimentBadge, backgroundColor: config.bg }}>
              <Text style={{ fontSize: '32px', margin: '0' }}>{config.emoji}</Text>
              <Text style={{ ...sentimentLabel, color: config.color }}>{config.label}</Text>
            </div>
            <Heading style={h1}>New User Feedback Received</Heading>
            <Text style={subtitle}>Smartslate Polaris Feedback System</Text>
          </Section>

          {/* Quick Stats Bar */}
          <Section style={statsBar}>
            <Row>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Sentiment</Text>
                <Text style={{ ...statValue, color: config.color }}>
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </Text>
              </Column>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Category</Text>
                <Text style={statValue}>{category}</Text>
              </Column>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Time</Text>
                <Text style={statValue}>
                  {new Date(timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Main Feedback Message */}
          <Section style={messageSection}>
            <Heading as="h2" style={h2}>
              <Text style={messageIcon}>💬</Text> User Message
            </Heading>
            <div style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </div>
          </Section>

          {/* User Information Card */}
          <Section style={userSection}>
            <Heading as="h2" style={h2}>
              <Text style={userIcon}>👤</Text> User Details
            </Heading>
            <div style={userCard}>
              <Row style={userRow}>
                <Column style={{ width: '30%' }}>
                  <Text style={userLabel}>User ID</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text style={userValue}>
                    <code style={codeStyle}>{userId}</code>
                  </Text>
                </Column>
              </Row>

              <Row style={userRow}>
                <Column style={{ width: '30%' }}>
                  <Text style={userLabel}>Account Email</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text style={userValue}>
                    <Link href={`mailto:${userEmail}`} style={emailLink}>
                      {userEmail}
                    </Link>
                  </Text>
                </Column>
              </Row>

              {contactEmail && contactEmail !== userEmail && (
                <Row style={userRow}>
                  <Column style={{ width: '30%' }}>
                    <Text style={userLabel}>Reply To</Text>
                  </Column>
                  <Column style={{ width: '70%' }}>
                    <Text style={userValue}>
                      <Link href={`mailto:${contactEmail}`} style={emailLink}>
                        {contactEmail}
                      </Link>
                    </Text>
                  </Column>
                </Row>
              )}

              <Row style={userRow}>
                <Column style={{ width: '30%' }}>
                  <Text style={userLabel}>Feedback ID</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text style={userValue}>
                    <code style={codeStyle}>{feedbackId}</code>
                  </Text>
                </Column>
              </Row>

              <Row style={{ ...userRow, borderBottom: 'none' }}>
                <Column style={{ width: '30%' }}>
                  <Text style={userLabel}>Submitted</Text>
                </Column>
                <Column style={{ width: '70%' }}>
                  <Text style={userValue}>{formattedDate}</Text>
                </Column>
              </Row>
            </div>
          </Section>

          {/* Action Buttons */}
          <Section style={actionSection}>
            <Row>
              <Column style={{ width: '48%', paddingRight: '2%' }}>
                <Link
                  href={`mailto:${contactEmail || userEmail}?subject=Re: Your Feedback on Smartslate Polaris`}
                  style={primaryActionButton}
                >
                  Reply to User
                </Link>
              </Column>
              <Column style={{ width: '48%', paddingLeft: '2%' }}>
                <Link
                  href={`${baseUrl}/admin/feedback/${feedbackId}`}
                  style={secondaryActionButton}
                >
                  View in Dashboard
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              This is an automated notification from the Smartslate Polaris feedback system.
            </Text>
            <Text style={footerText}>
              You're receiving this because you're listed as an admin for Smartslate Polaris.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/admin/feedback`} style={footerLink}>
                All Feedback
              </Link>
              {' • '}
              <Link href={`${baseUrl}/admin/settings`} style={footerLink}>
                Admin Settings
              </Link>
              {' • '}
              <Link href={`${baseUrl}/admin/notifications`} style={footerLink}>
                Notification Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '20px',
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
  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  padding: '40px',
  textAlign: 'center' as const,
};

const sentimentBadge = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: '12px',
  marginBottom: '20px',
};

const sentimentLabel = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '4px 0 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px',
  letterSpacing: '-0.5px',
};

const subtitle = {
  color: '#cbd5e1',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
};

const statsBar = {
  backgroundColor: '#f0fdfa',
  padding: '20px',
  borderTop: '4px solid #14b8a6',
};

const statLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const statValue = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0',
};

const messageSection = {
  padding: '32px 40px',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const messageIcon = {
  fontSize: '20px',
  margin: '0',
};

const messageBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#334155',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const userSection = {
  padding: '0 40px 32px',
};

const userIcon = {
  fontSize: '20px',
  margin: '0',
};

const userCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
};

const userRow = {
  paddingBottom: '12px',
  marginBottom: '12px',
  borderBottom: '1px solid #f1f5f9',
};

const userLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const userValue = {
  fontSize: '15px',
  color: '#1e293b',
  margin: '0',
};

const codeStyle = {
  backgroundColor: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '13px',
  fontFamily: 'monospace',
};

const emailLink = {
  color: '#14b8a6',
  textDecoration: 'none',
  fontWeight: '500',
};

const actionSection = {
  padding: '0 40px 40px',
};

const primaryActionButton = {
  display: 'block',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '14px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const secondaryActionButton = {
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
};

const footer = {
  backgroundColor: '#f8fafc',
  padding: '32px 40px',
};

const footerDivider = {
  borderColor: '#e2e8f0',
  margin: '0 0 24px 0',
};

const footerText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#14b8a6',
  textDecoration: 'none',
  fontWeight: '500',
};
