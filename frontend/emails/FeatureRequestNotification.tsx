/**
 * Feature Request Notification Email Template
 * Admin notification for feature request submissions
 * Modern design with priority indicators
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

interface FeatureRequestNotificationProps {
  requestId: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  useCase?: string;
  contactEmail?: string;
  timestamp: string;
}

export default function FeatureRequestNotification({
  requestId,
  userId,
  userEmail,
  title,
  description,
  category,
  priority,
  useCase,
  contactEmail,
  timestamp,
}: FeatureRequestNotificationProps) {
  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const priorityConfig: Record<string, any> = {
    low: {
      icon: '🟢',
      color: '#10b981',
      bg: '#f0fdf4',
      label: 'Low Priority',
    },
    medium: {
      icon: '🟡',
      color: '#f59e0b',
      bg: '#fef3c7',
      label: 'Medium Priority',
    },
    high: {
      icon: '🟠',
      color: '#ea580c',
      bg: '#fed7aa',
      label: 'High Priority',
    },
    critical: {
      icon: '🔴',
      color: '#dc2626',
      bg: '#fee2e2',
      label: 'Critical Priority',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
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
        New {priority} priority feature request: {title}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Priority Indicator */}
          <Section style={header}>
            <div style={{ ...priorityBadge, backgroundColor: config.bg }}>
              <Text style={{ fontSize: '32px', margin: '0' }}>{config.icon}</Text>
              <Text style={{ ...priorityLabel, color: config.color }}>{config.label}</Text>
            </div>
            <Heading style={h1}>New Feature Request</Heading>
            <Text style={subtitle}>SmartSlate Polaris Product Enhancement</Text>
          </Section>

          {/* Feature Title Bar */}
          <Section style={titleBar}>
            <Text style={featureIcon}>💡</Text>
            <Text style={featureTitle}>{title}</Text>
          </Section>

          {/* Quick Stats */}
          <Section style={statsBar}>
            <Row>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Priority</Text>
                <Text style={{ ...statValue, color: config.color }}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </Column>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Category</Text>
                <Text style={statValue}>{category}</Text>
              </Column>
              <Column style={{ width: '33.33%', textAlign: 'center' as const }}>
                <Text style={statLabel}>Request ID</Text>
                <Text style={statValue}>#{requestId.slice(0, 8)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Description Section */}
          <Section style={descriptionSection}>
            <Heading as="h2" style={h2}>
              <Text style={sectionIcon}>📝</Text> Description
            </Heading>
            <div style={descriptionBox}>
              <Text style={descriptionText}>{description}</Text>
            </div>
          </Section>

          {/* Use Case Section (if provided) */}
          {useCase && (
            <Section style={useCaseSection}>
              <Heading as="h2" style={h2}>
                <Text style={sectionIcon}>🎯</Text> Use Case
              </Heading>
              <div style={useCaseBox}>
                <Text style={useCaseText}>{useCase}</Text>
              </div>
            </Section>
          )}

          {/* User Information Card */}
          <Section style={userSection}>
            <Heading as="h2" style={h2}>
              <Text style={sectionIcon}>👤</Text> Submitted By
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
                  <Text style={userLabel}>Email</Text>
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
                    <Text style={userLabel}>Contact</Text>
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
              <Column style={{ width: '31%', paddingRight: '2%' }}>
                <Link href={`${baseUrl}/admin/features/${requestId}`} style={primaryActionButton}>
                  Review Request
                </Link>
              </Column>
              <Column style={{ width: '31%', padding: '0 2%' }}>
                <Link
                  href={`mailto:${contactEmail || userEmail}?subject=Re: Feature Request - ${title}`}
                  style={secondaryActionButton}
                >
                  Contact User
                </Link>
              </Column>
              <Column style={{ width: '31%', paddingLeft: '2%' }}>
                <Link href={`${baseUrl}/admin/features/roadmap`} style={tertiaryActionButton}>
                  View Roadmap
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              This is an automated notification from the SmartSlate Polaris feature request system.
            </Text>
            <Text style={footerText}>
              You're receiving this because you're listed as a product team member.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/admin/features`} style={footerLink}>
                All Requests
              </Link>
              {' • '}
              <Link href={`${baseUrl}/admin/roadmap`} style={footerLink}>
                Product Roadmap
              </Link>
              {' • '}
              <Link href={`${baseUrl}/admin/notifications`} style={footerLink}>
                Notification Settings
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
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  padding: '40px',
  textAlign: 'center' as const,
};

const priorityBadge = {
  display: 'inline-block',
  padding: '12px 20px',
  borderRadius: '12px',
  marginBottom: '20px',
};

const priorityLabel = {
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
  color: '#e9d5ff',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
};

const titleBar = {
  backgroundColor: '#f0f9ff',
  padding: '24px 40px',
  borderTop: '4px solid #0ea5e9',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const featureIcon = {
  fontSize: '28px',
  margin: '0',
};

const featureTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0c4a6e',
  margin: '0',
  flex: '1',
};

const statsBar = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderBottom: '1px solid #e2e8f0',
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

const descriptionSection = {
  padding: '32px 40px',
};

const h2 = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0 0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const sectionIcon = {
  fontSize: '18px',
  margin: '0',
};

const descriptionBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
};

const descriptionText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#334155',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const useCaseSection = {
  padding: '0 40px 32px',
};

const useCaseBox = {
  backgroundColor: '#f0fdfa',
  border: '1px solid #5eead4',
  borderRadius: '12px',
  padding: '20px',
};

const useCaseText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#134e4a',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const userSection = {
  padding: '0 40px 32px',
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
  padding: '14px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const secondaryActionButton = {
  display: 'block',
  backgroundColor: '#ffffff',
  color: '#14b8a6',
  padding: '14px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'center' as const,
  border: '2px solid #14b8a6',
};

const tertiaryActionButton = {
  display: 'block',
  backgroundColor: '#f8fafc',
  color: '#475569',
  padding: '14px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'center' as const,
  border: '2px solid #e2e8f0',
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
