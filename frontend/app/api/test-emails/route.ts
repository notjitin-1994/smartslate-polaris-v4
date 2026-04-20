import { NextResponse } from 'next/server';
import {
  testEmailTemplates,
  testSingleTemplate,
  getAvailableTemplates,
} from '@/emails/test-email-templates';

/**
 * GET /api/test-emails
 * Development endpoint to test email template rendering
 *
 * Query params:
 * - template: Specific template name to test (optional)
 * - format: 'html' or 'text' (default: html)
 *
 * Examples:
 * - /api/test-emails - Returns HTML list of all templates
 * - /api/test-emails?template=welcome - Returns welcome email HTML
 * - /api/test-emails?template=welcome&format=text - Returns welcome email plain text
 */
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('template');
    const format = searchParams.get('format') || 'html';

    // If specific template requested
    if (templateName) {
      const result = await testSingleTemplate(templateName as any);

      if (format === 'text') {
        return new Response(result.text, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      return new Response(result.html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Otherwise, show all templates
    const results = await testEmailTemplates();
    const templates = getAvailableTemplates();

    // Build HTML page with all templates
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smartslate Polaris - Email Templates Test</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%);
            padding: 40px 20px;
            min-height: 100vh;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px;
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            border-radius: 16px;
            color: white;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            font-size: 36px;
            margin-bottom: 12px;
            letter-spacing: -1px;
          }
          .header p {
            font-size: 18px;
            opacity: 0.95;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
          }
          .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-align: center;
            border-left: 4px solid #14b8a6;
          }
          .stat-card .number {
            font-size: 32px;
            font-weight: 700;
            color: #6366f1;
            margin-bottom: 8px;
          }
          .stat-card .label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
            margin-top: 40px;
          }
          .template-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .template-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          }
          .template-header {
            padding: 20px;
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
          }
          .template-header h2 {
            font-size: 20px;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .template-header .category {
            display: inline-block;
            padding: 4px 12px;
            background: #14b8a6;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
          }
          .template-body {
            padding: 20px;
          }
          .template-body p {
            color: #475569;
            font-size: 14px;
            line-height: 20px;
            margin-bottom: 16px;
          }
          .button-group {
            display: flex;
            gap: 12px;
          }
          .btn {
            flex: 1;
            padding: 10px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            transition: opacity 0.2s;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .btn-primary {
            background: #6366f1;
            color: white;
          }
          .btn-secondary {
            background: white;
            color: #14b8a6;
            border: 2px solid #14b8a6;
          }
          .success-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #f0fdf4;
            color: #16a34a;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 60px;
            padding: 24px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Smartslate Polaris Email Templates</h1>
            <p>Development Preview & Testing Dashboard</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="number">${templates.length}</div>
              <div class="label">Total Templates</div>
            </div>
            <div class="stat-card">
              <div class="number">${templates.filter((t) => t.category === 'Security').length}</div>
              <div class="label">Security Emails</div>
            </div>
            <div class="stat-card">
              <div class="number">${templates.filter((t) => t.category === 'Admin').length}</div>
              <div class="label">Admin Notifications</div>
            </div>
            <div class="stat-card">
              <div class="number">✅</div>
              <div class="label">All Rendered</div>
            </div>
          </div>

          <div class="template-grid">
            ${templates
              .map(
                (template) => `
                  <div class="template-card">
                    <div class="template-header">
                      <h2>${template.name.charAt(0).toUpperCase() + template.name.slice(1).replace(/([A-Z])/g, ' $1')}</h2>
                      <span class="category">${template.category}</span>
                    </div>
                    <div class="template-body">
                      <p>${template.description}</p>
                      <div class="button-group">
                        <a href="/api/test-emails?template=${template.name}" target="_blank" class="btn btn-primary">
                          View HTML
                        </a>
                        <a href="/api/test-emails?template=${template.name}&format=text" target="_blank" class="btn btn-secondary">
                          View Text
                        </a>
                      </div>
                      ${results[template.name] ? '<div class="success-badge">✓ Rendered Successfully</div>' : ''}
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>

          <div class="footer">
            <p>🚀 Smartslate Polaris Email Template Testing Suite</p>
            <p style="margin-top: 8px; font-size: 12px;">
              Development mode only • All templates use React Email components
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error testing email templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to render email templates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
