/**
 * Data Export Ready Email Template
 * Modern download-focused design with clear CTAs
 */

import { Text, Button, Section, Row, Column } from '@react-email/components';
import { BaseEmail } from './base';

interface DataExportReadyEmailProps {
  userName?: string;
  exportType: string;
  exportFormat: string;
  downloadUrl: string;
  expiresAt: string;
  fileSizeBytes: number;
}

export function DataExportReadyEmail({
  userName = 'there',
  exportType,
  exportFormat,
  downloadUrl,
  expiresAt,
  fileSizeBytes,
}: DataExportReadyEmailProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartslate.io';
  const expiryDate = new Date(expiresAt);
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <BaseEmail preview="Your SmartSlate Polaris data export is ready for download">
      {/* Success Icon */}
      <Section style={iconSection}>
        <div style={iconWrapper}>
          <Text style={downloadIcon}>📦</Text>
        </div>
      </Section>

      <Text style={title}>Your Data Export is Ready!</Text>

      <Text style={greeting}>Hi {userName},</Text>

      <Text style={paragraph}>
        Great news! Your requested data export from SmartSlate Polaris is now ready for download.
        We've compiled your {exportType} data into a convenient {exportFormat.toUpperCase()} file.
      </Text>

      {/* Export Details Card */}
      <Section style={exportCard}>
        <Row>
          <Column style={{ width: '100%' }}>
            <Text style={exportCardTitle}>Export Details</Text>

            <Row style={detailRow}>
              <Column style={{ width: '50%' }}>
                <Text style={detailLabel}>Data Type</Text>
                <Text style={detailValue}>{exportType}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={detailLabel}>Format</Text>
                <Text style={detailValue}>{exportFormat.toUpperCase()}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column style={{ width: '50%' }}>
                <Text style={detailLabel}>File Size</Text>
                <Text style={detailValue}>{formatFileSize(fileSizeBytes)}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={detailLabel}>Expires In</Text>
                <Text style={detailValueHighlight}>{daysUntilExpiry} days</Text>
              </Column>
            </Row>

            <Text style={expiryNote}>
              Download expires on{' '}
              {expiryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Download Button */}
      <Section style={downloadSection}>
        <Button style={downloadButton} href={downloadUrl}>
          Download Your Data Export
        </Button>
        <Text style={downloadHelper}>
          Click the button above to download your {formatFileSize(fileSizeBytes)} file
        </Text>
      </Section>

      {/* Info Sections */}
      <Section style={infoGrid}>
        <Row>
          <Column style={{ width: '48%', paddingRight: '2%' }}>
            <div style={infoCard}>
              <Text style={infoIcon}>📋</Text>
              <Text style={infoTitle}>What's Included</Text>
              <Text style={infoText}>
                Your complete {exportType} data including all learning blueprints, questionnaire
                responses, and related metadata from your SmartSlate Polaris account.
              </Text>
            </div>
          </Column>
          <Column style={{ width: '48%', paddingLeft: '2%' }}>
            <div style={infoCard}>
              <Text style={infoIcon}>🔒</Text>
              <Text style={infoTitle}>Privacy & Security</Text>
              <Text style={infoText}>
                This export is GDPR-compliant and contains your personal data as requested under
                Article 20 (Right to Data Portability).
              </Text>
            </div>
          </Column>
        </Row>
      </Section>

      {/* Warning Banner */}
      <Section style={warningBanner}>
        <Row>
          <Column style={{ width: '40px', verticalAlign: 'top' }}>
            <Text style={warningIcon}>⏰</Text>
          </Column>
          <Column style={{ paddingLeft: '12px' }}>
            <Text style={warningTitle}>Download Link Expires Soon</Text>
            <Text style={warningText}>
              For security reasons, this download link will expire in {daysUntilExpiry} days. Please
              download your data before the expiration date.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Help Section */}
      <Section style={helpSection}>
        <Text style={helpTitle}>Need Help?</Text>
        <Text style={helpText}>
          If you're having trouble downloading your data or didn't request this export, please
          contact our support team immediately.
        </Text>
        <Button style={supportButton} href={`${baseUrl}/support`}>
          Contact Support
        </Button>
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

const downloadIcon = {
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

const exportCard = {
  backgroundColor: '#f0fdfa',
  border: '2px solid #14b8a6',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const exportCardTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '20px',
  textAlign: 'left' as const,
};

const detailRow = {
  marginBottom: '16px',
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
  fontSize: '16px',
  fontWeight: '500',
  color: '#1e293b',
  margin: '0',
  textAlign: 'left' as const,
};

const detailValueHighlight = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0d9488',
  margin: '0',
  textAlign: 'left' as const,
};

const expiryNote = {
  fontSize: '13px',
  color: '#64748b',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #ccfbf1',
  textAlign: 'left' as const,
};

const downloadSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const downloadButton = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '16px 48px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
};

const downloadHelper = {
  fontSize: '13px',
  color: '#64748b',
  marginTop: '12px',
  textAlign: 'center' as const,
};

const infoGrid = {
  marginBottom: '32px',
};

const infoCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  height: '100%',
};

const infoIcon = {
  fontSize: '24px',
  marginBottom: '8px',
  display: 'block',
};

const infoTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '8px',
  textAlign: 'left' as const,
};

const infoText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#475569',
  margin: '0',
  textAlign: 'left' as const,
};

const warningBanner = {
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

const helpSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const helpTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '8px',
};

const helpText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#475569',
  marginBottom: '16px',
};

const supportButton = {
  backgroundColor: '#ffffff',
  color: '#14b8a6',
  padding: '12px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  display: 'inline-block',
  border: '2px solid #14b8a6',
};

export default DataExportReadyEmail;
