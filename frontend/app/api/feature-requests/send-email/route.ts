/**
 * Feature Request Email Notification API Route
 *
 * POST /api/feature-requests/send-email
 *
 * Internal API route to send email notifications for feature request submissions.
 * This is called asynchronously from the main feature request submit route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import FeatureRequestNotification from '@/emails/FeatureRequestNotification';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;
const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Simple internal request validation
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      requestId,
      userId,
      userEmail,
      title,
      description,
      category,
      priority,
      contactEmail,
      timestamp,
    } = body;

    // Validate required fields
    if (!requestId || !userId || !userEmail || !title || !description || !category || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if Resend API key is configured
    const resendClient = getResendClient();
    if (!resendClient) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Render email template
    const emailHtml = await render(
      FeatureRequestNotification({
        requestId,
        userId,
        userEmail,
        title,
        description,
        category,
        priority,
        contactEmail,
        timestamp: timestamp || new Date().toISOString(),
      })
    );

    // Send email via Resend
    const { data, error } = await resendClient.emails.send({
      from: 'Smartslate Polaris <noreply@smartslate.io>',
      to: ['jitin@smartslate.io'],
      subject: `Feature Request: ${title}`,
      html: emailHtml,
      replyTo: contactEmail || userEmail,
    });

    if (error) {
      console.error('[FEATURE REQUEST EMAIL] Resend API error:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        fullError: error,
      });
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    console.log('[FEATURE REQUEST EMAIL] Email sent successfully via Resend:', data?.id);

    return NextResponse.json({ success: true, emailId: data?.id }, { status: 200 });
  } catch (error) {
    console.error('Error sending feature request email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
