/**
 * Email Logging Service
 * Integrates Resend email sending with database logging
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail, sendTemplateEmail, type SendEmailOptions, type EmailType } from './resend';

export interface LoggedEmailOptions extends SendEmailOptions {
  userId?: string;
  emailType: EmailType;
  templateId?: string;
  templateData?: Record<string, any>;
}

/**
 * Send email and log to database
 * This is the primary function to use for sending emails
 */
export async function sendAndLogEmail(options: LoggedEmailOptions) {
  const supabase = await createClient();

  // Extract user email if userId provided
  const recipientEmail = Array.isArray(options.to) ? options.to[0] : options.to;

  // Create log entry in pending state
  const { data: logEntry, error: logError } = await supabase.rpc('log_email_notification', {
    p_user_id: options.userId || null,
    p_recipient_email: recipientEmail,
    p_email_type: options.emailType,
    p_subject: options.subject,
    p_template_id: options.templateId || null,
    p_template_data: options.templateData || {},
  });

  if (logError) {
    console.error('Failed to create email log entry:', logError);
  }

  const logId = logEntry;

  // Send the email
  const result = await sendEmail(options);

  // Update log entry based on result
  if (result.success && logId) {
    await supabase.rpc('mark_email_sent', {
      p_log_id: logId,
      p_provider_id: result.messageId || null,
      p_provider_metadata: {
        sent_at: new Date().toISOString(),
      },
    });
  } else if (logId) {
    await supabase.rpc('mark_email_failed', {
      p_log_id: logId,
      p_error_message: result.error || 'Unknown error',
      p_error_code: 'SEND_FAILED',
    });
  }

  return {
    ...result,
    logId,
  };
}

/**
 * Send template email and log to database
 */
export async function sendAndLogTemplateEmail(
  to: string | string[],
  subject: string,
  template: React.ReactElement,
  options: {
    userId?: string;
    emailType: EmailType;
    templateId?: string;
    templateData?: Record<string, any>;
    additionalOptions?: Partial<SendEmailOptions>;
  }
) {
  const supabase = await createClient();

  const recipientEmail = Array.isArray(to) ? to[0] : to;

  // Create log entry
  const { data: logEntry, error: logError } = await supabase.rpc('log_email_notification', {
    p_user_id: options.userId || null,
    p_recipient_email: recipientEmail,
    p_email_type: options.emailType,
    p_subject: subject,
    p_template_id: options.templateId || null,
    p_template_data: options.templateData || {},
  });

  if (logError) {
    console.error('Failed to create email log entry:', logError);
  }

  const logId = logEntry;

  // Send the email
  const result = await sendTemplateEmail(to, subject, template, options.additionalOptions);

  // Update log entry
  if (result.success && logId) {
    await supabase.rpc('mark_email_sent', {
      p_log_id: logId,
      p_provider_id: result.messageId || null,
      p_provider_metadata: {
        sent_at: new Date().toISOString(),
      },
    });
  } else if (logId) {
    await supabase.rpc('mark_email_failed', {
      p_log_id: logId,
      p_error_message: result.error || 'Unknown error',
      p_error_code: 'SEND_FAILED',
    });
  }

  return {
    ...result,
    logId,
  };
}

/**
 * Get email sending history for a user
 */
export async function getUserEmailHistory(userId: string, limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_notifications_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch email history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get email statistics for a user
 */
export async function getUserEmailStats(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_email_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to fetch email stats:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Retry failed email
 */
export async function retryFailedEmail(logId: string) {
  const supabase = await createClient();

  // Get the original email details
  const { data: log, error: fetchError } = await supabase
    .from('email_notifications_log')
    .select('*')
    .eq('id', logId)
    .single();

  if (fetchError || !log) {
    console.error('Failed to fetch email log:', fetchError);
    return {
      success: false,
      error: 'Email log not found',
    };
  }

  // Check retry count
  if (log.retry_count >= 3) {
    return {
      success: false,
      error: 'Maximum retry attempts reached',
    };
  }

  // Resend the email
  const result = await sendEmail({
    to: log.recipient_email,
    subject: log.subject,
    html: '', // TODO: Store HTML content or regenerate from template
    tags: [
      { name: 'retry_attempt', value: (log.retry_count + 1).toString() },
      { name: 'original_log_id', value: logId },
    ],
  });

  // Update log entry
  if (result.success) {
    await supabase.rpc('mark_email_sent', {
      p_log_id: logId,
      p_provider_id: result.messageId || null,
      p_provider_metadata: {
        retry_attempt: log.retry_count + 1,
        retried_at: new Date().toISOString(),
      },
    });
  } else {
    await supabase.rpc('mark_email_failed', {
      p_log_id: logId,
      p_error_message: result.error || 'Retry failed',
      p_error_code: 'RETRY_FAILED',
    });
  }

  return result;
}
