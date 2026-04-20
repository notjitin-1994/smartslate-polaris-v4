/**
 * Account Deletion Scheduled Email Template
 * Critical warning design with prominent cancel action
 */

import { Text, Button, Section, Row, Column } from '@react-email/components';
import { BaseEmail } from './base';

interface AccountDeletionScheduledEmailProps {
  userName?: string;
  scheduledDeletionDate: string;
  daysRemaining: number;
  cancelUrl: string;
}

export function AccountDeletionScheduledEmail({
  userName = 'there',
  scheduledDeletionDate,
  daysRemaining,
  cancelUrl,
}: AccountDeletionScheduledEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';
  const deletionDate = new Date(scheduledDeletionDate);

  return (
    <BaseEmail preview="Important: Your SmartSlate Polaris account is scheduled for deletion">
      {/* Warning Icon */}
      <Section style={iconSection}>
        <div style={iconWrapper}>
          <Text style={warningIconLarge}>⚠️</Text>
        </div>
      </Section>

      <Text style={title}>Account Deletion Scheduled</Text>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        We've received your request to delete your SmartSlate Polaris account. This is a permanent
        action that will completely remove your account and all associated data from our systems.
      </Text>

      {/* Deletion Countdown Card */}
      <Section style={countdownCard}>
        <Text style={countdownTitle}>Your account will be deleted in:</Text>
        <Text style={countdownNumber}>{daysRemaining}</Text>
        <Text style={countdownLabel}>DAYS</Text>
        <Text style={deletionDateText}>
          Scheduled for:{' '}
          {deletionDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Section>

      {/* What Will Be Deleted */}
      <Section style={deletionDetailsSection}>
        <Text style={sectionTitle}>What Will Be Permanently Deleted</Text>

        <Row style={deletionRow}>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <div style={deletionCard}>
              <Text style={deletionIcon}>👤</Text>
              <Text style={deletionItemTitle}>Profile & Personal Data</Text>
              <Text style={deletionItemText}>
                All your personal information, preferences, and account settings
              </Text>
            </div>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <div style={deletionCard}>
              <Text style={deletionIcon}>📘</Text>
              <Text style={deletionItemTitle}>Learning Blueprints</Text>
              <Text style={deletionItemText}>
                All generated blueprints and questionnaire responses
              </Text>
            </div>
          </Column>
        </Row>

        <Row style={deletionRow}>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <div style={deletionCard}>
              <Text style={deletionIcon}>💳</Text>
              <Text style={deletionItemTitle}>Subscription & Billing</Text>
              <Text style={deletionItemText}>Payment history and subscription information</Text>
            </div>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <div style={deletionCard}>
              <Text style={deletionIcon}>📊</Text>
              <Text style={deletionItemTitle}>Usage History</Text>
              <Text style={deletionItemText}>Activity logs and usage statistics</Text>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Critical Warning */}
      <Section style={criticalWarning}>
        <Row>
          <Column style={{ width: '40px', verticalAlign: 'top' }}>
            <Text style={criticalIcon}>🚨</Text>
          </Column>
          <Column style={{ paddingLeft: '12px' }}>
            <Text style={criticalTitle}>This Action Cannot Be Undone</Text>
            <Text style={criticalText}>
              Once your account is deleted, all your data will be permanently erased. You will not
              be able to recover any information, including your learning blueprints and
              questionnaire responses.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Changed Your Mind Section */}
      <Section style={cancelSection}>
        <Text style={cancelTitle}>Changed Your Mind?</Text>
        <Text style={cancelText}>
          You can cancel this deletion request at any time before the scheduled date. Your account
          and all data will remain intact.
        </Text>
        <Button style={cancelButton} href={cancelUrl}>
          Cancel Deletion Request
        </Button>
        <Text style={cancelNote}>
          This link will allow you to immediately stop the deletion process
        </Text>
      </Section>

      {/* Alternative Actions */}
      <Section style={alternativeSection}>
        <Text style={alternativeTitle}>Before You Go</Text>
        <Text style={alternativeText}>Consider these alternatives:</Text>

        <div style={alternativeOption}>
          <Text style={alternativeOptionTitle}>📥 Export Your Data</Text>
          <Text style={alternativeOptionText}>
            Download all your blueprints and data before deletion.{' '}
            <a href={`${baseUrl}/account/export`} style={alternativeLink}>
              Export Data →
            </a>
          </Text>
        </div>

        <div style={alternativeOption}>
          <Text style={alternativeOptionTitle}>⏸️ Pause Your Account</Text>
          <Text style={alternativeOptionText}>
            Temporarily disable your account instead of deleting it.{' '}
            <a href={`${baseUrl}/account/pause`} style={alternativeLink}>
              Pause Account →
            </a>
          </Text>
        </div>

        <div style={alternativeOption}>
          <Text style={alternativeOptionTitle}>💬 Talk to Support</Text>
          <Text style={alternativeOptionText}>
            Let us know if there's something we can help with.{' '}
            <a href={`${baseUrl}/support`} style={alternativeLink}>
              Contact Support →
            </a>
          </Text>
        </div>
      </Section>

      {/* Footer Warning */}
      <Section style={footerWarning}>
        <Text style={footerWarningText}>
          If you didn't request this deletion, please{' '}
          <a href={`${baseUrl}/support`} style={urgentLink}>
            contact support immediately
          </a>{' '}
          to secure your account.
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
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
};

const warningIconLarge = {
  fontSize: '48px',
  margin: '0',
};

const title = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#dc2626',
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

const countdownCard = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '12px',
  padding: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const countdownTitle = {
  fontSize: '16px',
  color: '#7f1d1d',
  marginBottom: '16px',
  textAlign: 'center' as const,
};

const countdownNumber = {
  fontSize: '64px',
  fontWeight: '800',
  color: '#dc2626',
  margin: '0',
  lineHeight: '1',
  textAlign: 'center' as const,
};

const countdownLabel = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#991b1b',
  marginTop: '8px',
  marginBottom: '16px',
  letterSpacing: '2px',
  textAlign: 'center' as const,
};

const deletionDateText = {
  fontSize: '14px',
  color: '#7f1d1d',
  margin: '0',
  textAlign: 'center' as const,
};

const deletionDetailsSection = {
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '20px',
  textAlign: 'left' as const,
};

const deletionRow = {
  marginBottom: '16px',
};

const deletionCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  height: '100%',
  borderLeft: '4px solid #fbbf24',
};

const deletionIcon = {
  fontSize: '24px',
  marginBottom: '8px',
  display: 'block',
};

const deletionItemTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const deletionItemText = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#64748b',
  margin: '0',
  textAlign: 'left' as const,
};

const criticalWarning = {
  backgroundColor: '#7f1d1d',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '32px',
};

const criticalIcon = {
  fontSize: '24px',
  margin: '0',
};

const criticalTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#ffffff',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const criticalText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#fecaca',
  margin: '0',
  textAlign: 'left' as const,
};

const cancelSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const cancelTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#14532d',
  marginBottom: '12px',
  textAlign: 'center' as const,
};

const cancelText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#166534',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const cancelButton = {
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '16px 48px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
};

const cancelNote = {
  fontSize: '13px',
  color: '#15803d',
  marginTop: '12px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
};

const alternativeSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const alternativeTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const alternativeText = {
  fontSize: '14px',
  color: '#475569',
  marginBottom: '20px',
  textAlign: 'left' as const,
};

const alternativeOption = {
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #e2e8f0',
};

const alternativeOptionTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: '4px',
  textAlign: 'left' as const,
};

const alternativeOptionText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#64748b',
  margin: '0',
  textAlign: 'left' as const,
};

const alternativeLink = {
  color: '#14b8a6',
  textDecoration: 'none',
  fontWeight: '500',
};

const footerWarning = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '32px',
};

const footerWarningText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#92400e',
  margin: '0',
  textAlign: 'center' as const,
  fontWeight: '500',
};

const urgentLink = {
  color: '#dc2626',
  fontWeight: '600',
};

export default AccountDeletionScheduledEmail;
