/**
 * Email Template Test Suite
 * Test file to verify all email templates render correctly
 *
 * Run this with: npm run dev
 * Then visit: http://localhost:3000/test-emails
 */

import { render } from '@react-email/render';
import { PasswordChangedEmail } from './templates/password-changed';
import { DataExportReadyEmail } from './templates/data-export-ready';
import { AccountDeletionScheduledEmail } from './templates/account-deletion-scheduled';
import { VerificationEmail } from './templates/verification';
import { WelcomeEmail } from './templates/welcome';
import FeedbackNotification from './FeedbackNotification';
import FeatureRequestNotification from './FeatureRequestNotification';

// Test data for each email template
const testData = {
  passwordChanged: {
    userName: 'John Doe',
    changedAt: new Date().toISOString(),
    ipAddress: '192.168.1.1',
    location: 'San Francisco, CA',
    device: 'Chrome on MacOS',
  },
  dataExportReady: {
    userName: 'Jane Smith',
    exportType: 'All Learning Blueprints',
    exportFormat: 'json',
    downloadUrl: 'https://app.smartslate.io/exports/download/abc123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fileSizeBytes: 2457600,
  },
  accountDeletion: {
    userName: 'Alex Johnson',
    scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 30,
    cancelUrl: 'https://app.smartslate.io/account/cancel-deletion',
  },
  verification: {
    userName: 'Sarah Williams',
    verificationUrl: 'https://app.smartslate.io/auth/verify?token=xyz789',
    expiresInHours: 24,
  },
  welcome: {
    userName: 'Michael Brown',
    userEmail: 'michael.brown@example.com',
    subscriptionTier: 'explorer',
    blueprintLimit: 2,
  },
  feedback: {
    feedbackId: 'fb-123456',
    userId: 'user-789',
    userEmail: 'user@example.com',
    sentiment: 'positive',
    category: 'User Experience',
    message:
      'I absolutely love the new AI-powered blueprint generation! The dynamic questions really help capture all the nuances of my learning goals. The interface is intuitive and the export options are fantastic.',
    contactEmail: 'contact@example.com',
    timestamp: new Date().toISOString(),
  },
  featureRequest: {
    requestId: 'fr-789012',
    userId: 'user-456',
    userEmail: 'requester@example.com',
    title: 'Add Team Collaboration Features',
    description:
      'It would be great to have the ability to share blueprints with team members and collaborate on learning paths. This could include commenting, real-time editing, and progress tracking for team leaders.',
    category: 'Collaboration',
    priority: 'high',
    useCase:
      'Our company wants to use SmartSlate Polaris for team training. We need managers to create learning blueprints for their teams and track progress across multiple team members.',
    contactEmail: 'team.lead@company.com',
    timestamp: new Date().toISOString(),
  },
};

/**
 * Test function to render all email templates
 * Returns an object with rendered HTML for each template
 */
export async function testEmailTemplates() {
  const results: Record<string, { html: string; text: string; subject?: string }> = {};

  try {
    // Test Password Changed Email
    results.passwordChanged = {
      html: await render(PasswordChangedEmail(testData.passwordChanged)),
      text: await render(PasswordChangedEmail(testData.passwordChanged), { plainText: true }),
      subject: 'Your SmartSlate Polaris password has been changed',
    };

    // Test Data Export Ready Email
    results.dataExportReady = {
      html: await render(DataExportReadyEmail(testData.dataExportReady)),
      text: await render(DataExportReadyEmail(testData.dataExportReady), { plainText: true }),
      subject: 'Your SmartSlate Polaris data export is ready for download',
    };

    // Test Account Deletion Scheduled Email
    results.accountDeletion = {
      html: await render(AccountDeletionScheduledEmail(testData.accountDeletion)),
      text: await render(AccountDeletionScheduledEmail(testData.accountDeletion), {
        plainText: true,
      }),
      subject: 'Important: Your SmartSlate Polaris account is scheduled for deletion',
    };

    // Test Verification Email
    results.verification = {
      html: await render(VerificationEmail(testData.verification)),
      text: await render(VerificationEmail(testData.verification), { plainText: true }),
      subject: 'Verify your SmartSlate Polaris account',
    };

    // Test Welcome Email
    results.welcome = {
      html: await render(WelcomeEmail(testData.welcome)),
      text: await render(WelcomeEmail(testData.welcome), { plainText: true }),
      subject: 'Welcome to SmartSlate Polaris - Your AI-powered learning journey begins!',
    };

    // Test Feedback Notification
    results.feedback = {
      html: await render(FeedbackNotification(testData.feedback)),
      text: await render(FeedbackNotification(testData.feedback), { plainText: true }),
      subject: `New ${testData.feedback.sentiment} feedback received from ${testData.feedback.userEmail}`,
    };

    // Test Feature Request Notification
    results.featureRequest = {
      html: await render(FeatureRequestNotification(testData.featureRequest)),
      text: await render(FeatureRequestNotification(testData.featureRequest), { plainText: true }),
      subject: `New ${testData.featureRequest.priority} priority feature request: ${testData.featureRequest.title}`,
    };

    console.log('✅ All email templates rendered successfully!');
    return results;
  } catch (error) {
    console.error('❌ Error rendering email templates:', error);
    throw error;
  }
}

/**
 * Test individual email template
 * @param templateName - Name of the template to test
 */
export async function testSingleTemplate(templateName: keyof typeof testData) {
  try {
    let html = '';
    let text = '';
    let subject = '';

    switch (templateName) {
      case 'passwordChanged':
        html = await render(PasswordChangedEmail(testData.passwordChanged));
        text = await render(PasswordChangedEmail(testData.passwordChanged), { plainText: true });
        subject = 'Your SmartSlate Polaris password has been changed';
        break;
      case 'dataExportReady':
        html = await render(DataExportReadyEmail(testData.dataExportReady));
        text = await render(DataExportReadyEmail(testData.dataExportReady), { plainText: true });
        subject = 'Your SmartSlate Polaris data export is ready for download';
        break;
      case 'accountDeletion':
        html = await render(AccountDeletionScheduledEmail(testData.accountDeletion));
        text = await render(AccountDeletionScheduledEmail(testData.accountDeletion), {
          plainText: true,
        });
        subject = 'Important: Your SmartSlate Polaris account is scheduled for deletion';
        break;
      case 'verification':
        html = await render(VerificationEmail(testData.verification));
        text = await render(VerificationEmail(testData.verification), { plainText: true });
        subject = 'Verify your SmartSlate Polaris account';
        break;
      case 'welcome':
        html = await render(WelcomeEmail(testData.welcome));
        text = await render(WelcomeEmail(testData.welcome), { plainText: true });
        subject = 'Welcome to SmartSlate Polaris - Your AI-powered learning journey begins!';
        break;
      case 'feedback':
        html = await render(FeedbackNotification(testData.feedback));
        text = await render(FeedbackNotification(testData.feedback), { plainText: true });
        subject = `New ${testData.feedback.sentiment} feedback received from ${testData.feedback.userEmail}`;
        break;
      case 'featureRequest':
        html = await render(FeatureRequestNotification(testData.featureRequest));
        text = await render(FeatureRequestNotification(testData.featureRequest), {
          plainText: true,
        });
        subject = `New ${testData.featureRequest.priority} priority feature request: ${testData.featureRequest.title}`;
        break;
      default:
        throw new Error(`Unknown template: ${templateName}`);
    }

    console.log(`✅ ${templateName} template rendered successfully!`);
    return { html, text, subject };
  } catch (error) {
    console.error(`❌ Error rendering ${templateName} template:`, error);
    throw error;
  }
}

/**
 * Get list of all available email templates
 */
export function getAvailableTemplates() {
  return [
    {
      name: 'passwordChanged',
      description: 'Security notification when password is changed',
      category: 'Security',
    },
    {
      name: 'dataExportReady',
      description: 'Notification when data export is ready for download',
      category: 'Account',
    },
    {
      name: 'accountDeletion',
      description: 'Warning when account deletion is scheduled',
      category: 'Account',
    },
    {
      name: 'verification',
      description: 'Email verification for new accounts',
      category: 'Authentication',
    },
    {
      name: 'welcome',
      description: 'Welcome email for new users after verification',
      category: 'Onboarding',
    },
    {
      name: 'feedback',
      description: 'Admin notification for user feedback submissions',
      category: 'Admin',
    },
    {
      name: 'featureRequest',
      description: 'Admin notification for feature request submissions',
      category: 'Admin',
    },
  ];
}

export default testEmailTemplates;
