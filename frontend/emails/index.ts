/**
 * Email Templates Index
 * Export all email templates and helper functions
 */

export { BaseEmail } from './templates/base';
export { PasswordChangedEmail } from './templates/password-changed';
export { DataExportReadyEmail } from './templates/data-export-ready';
export { AccountDeletionScheduledEmail } from './templates/account-deletion-scheduled';

// Re-export email services
export { sendEmail, sendTemplateEmail, sendBatchEmails, type EmailType } from '@/lib/email/resend';
export {
  sendAndLogEmail,
  sendAndLogTemplateEmail,
  getUserEmailHistory,
  getUserEmailStats,
  retryFailedEmail,
} from '@/lib/email/logger';
