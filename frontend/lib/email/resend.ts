/**
 * Resend Email Service
 * Handles all email sending through Resend API
 *
 * @see https://resend.com/docs
 */

import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;

    // For build time, create a dummy instance that will be replaced at runtime
    if (!apiKey) {
      console.warn('[RESEND] API key not found, using placeholder instance');
      // Create with a dummy key for build time - will be replaced at runtime
      resendInstance = new Resend('re_placeholder_for_build');
    } else {
      resendInstance = new Resend(apiKey);
    }
  }
  return resendInstance;
}

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'Smartslate <noreply@smartslate.io>',
  replyTo: process.env.RESEND_REPLY_TO || 'support@smartslate.io',
} as const;

// Email types for tracking
export type EmailType =
  | 'welcome'
  | 'password_reset'
  | 'password_changed'
  | 'email_verification'
  | 'blueprint_complete'
  | 'blueprint_shared'
  | 'weekly_digest'
  | 'security_alert'
  | 'session_created'
  | 'data_export_ready'
  | 'account_deletion_scheduled'
  | 'account_deletion_cancelled'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'payment_successful'
  | 'payment_failed';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || EMAIL_CONFIG.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
      headers: options.headers,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send an email with template (React component)
 */
export async function sendTemplateEmail(
  to: string | string[],
  subject: string,
  template: React.ReactElement,
  options?: Partial<SendEmailOptions>
): Promise<SendEmailResult> {
  try {
    // Import render function from @react-email/render
    const { render } = await import('@react-email/render');

    // NEW: Await the render calls as newer versions of @react-email/render are async
    const html = await render(template);
    const text = await render(template, { plainText: true });

    return sendEmail({
      to,
      subject,
      html,
      text,
      ...options,
    });
  } catch (error) {
    console.error('Failed to render and send template email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to render template',
    };
  }
}

/**
 * Send a batch of emails
 */
export async function sendBatchEmails(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
  const results = await Promise.allSettled(emails.map((email) => sendEmail(email)));

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Failed to send email',
      };
    }
  });
}

/**
 * Verify email domain configuration
 * @see https://resend.com/docs/api-reference/domains/verify-domain
 */
export async function verifyDomain(domain: string) {
  try {
    const resend = getResendClient();
    const result = await resend.domains.verify(domain);
    return result;
  } catch (error) {
    console.error('Failed to verify domain:', error);
    throw error;
  }
}

/**
 * Get email sending statistics
 * Useful for monitoring and analytics
 */
export async function getEmailStats() {
  // Note: Resend doesn't have a built-in stats API yet
  // This would query our email_notifications_log table instead
  // Implementation in separate analytics service
  throw new Error('Email stats should be queried from database');
}

// Export Resend client getter for advanced usage
export { getResendClient };
