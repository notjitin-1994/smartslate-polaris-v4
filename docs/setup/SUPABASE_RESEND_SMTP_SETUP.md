# Supabase SMTP Configuration with Resend

This guide walks you through setting up SMTP for Supabase using Resend for production email delivery (auth emails, password resets, etc.).

## Why Resend?

- **Modern API**: Clean, developer-friendly interface
- **Free Tier**: 3,000 emails/month for free
- **Fast Setup**: Get API key instantly
- **Reliable**: Built on AWS SES with automatic fallbacks
- **Great DX**: Excellent documentation and TypeScript support

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email or GitHub account
3. Verify your email address

## Step 2: Get Your Resend API Key

1. Log in to your Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Name it: `supabase-polaris-production`
5. Set permissions: **Sending access**
6. Copy the API key (starts with `re_`)
   - ⚠️ **Save this immediately** - you won't see it again!

## Step 3: Verify Your Domain (Production Only)

For production emails to work reliably, you need to verify your sending domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `smartslate.com` or `polaris.smartslate.com`)
4. Add the provided DNS records to your domain registrar:
   - **SPF record** (TXT)
   - **DKIM record** (TXT or CNAME)
   - **DMARC record** (TXT) - recommended
5. Wait for verification (usually 5-15 minutes)
6. Check verification status in Resend dashboard

### DNS Records Example (for reference):
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## Step 4: Configure Supabase Project (Production)

### Option A: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Polaris v3**
3. Navigate to **Authentication** > **Email Auth**
4. Scroll to **SMTP Settings**
5. Enable **SMTP** toggle
6. Fill in the following:

```
SMTP Host:     smtp.resend.com
Port:          465
Sender Email:  noreply@yourdomain.com  (must match verified domain)
Sender Name:   SmartSlate Polaris
Username:      resend
Password:      [Your Resend API Key - starts with re_]
```

7. Click **Save**
8. Test by sending a test email

### Option B: Supabase CLI (Alternative)

If you prefer to configure via CLI or need to version control settings:

1. Update `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "noreply@yourdomain.com"
sender_name = "SmartSlate Polaris"
```

2. Add to your environment variables:
```bash
# .env.local or deployment platform
RESEND_API_KEY=re_your_actual_resend_api_key_here
```

3. Push changes to Supabase:
```bash
npx supabase db push
```

## Step 5: Configure Email Templates (Optional)

Customize your authentication emails for better branding:

### Customize Invitation Email

1. Create `supabase/templates/invite.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to SmartSlate Polaris</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020C1B; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 32px; backdrop-filter: blur(40px); border: 1px solid rgba(167, 218, 219, 0.2);">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://yourdomain.com/logo.png" alt="SmartSlate Polaris" style="height: 48px; width: auto;">
    </div>

    <!-- Content -->
    <div style="color: #ffffff; line-height: 1.6;">
      <h1 style="color: #a7dadb; font-size: 24px; margin-bottom: 16px;">You've been invited!</h1>

      <p style="color: rgba(255,255,255,0.8); margin-bottom: 24px;">
        You've been invited to join SmartSlate Polaris. Click the button below to accept the invitation and create your account.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);">
          Accept Invitation
        </a>
      </div>

      <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 24px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="color: rgba(255,255,255,0.5); font-size: 12px;">
        &copy; 2025 SmartSlate Polaris. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

2. Update `supabase/config.toml`:

```toml
[auth.email.template.invite]
subject = "Welcome to SmartSlate Polaris"
content_path = "./supabase/templates/invite.html"

[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.magic_link]
subject = "Your magic link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.email_change]
subject = "Confirm email change"
content_path = "./supabase/templates/email_change.html"
```

## Step 6: Test Your SMTP Setup

### Test 1: Signup Email Confirmation

1. Go to your signup page: `http://localhost:3000/signup`
2. Create a new account with a real email
3. Check your inbox for confirmation email
4. Click the confirmation link
5. Verify successful login

### Test 2: Password Reset Email

1. Go to your login page: `http://localhost:3000/login`
2. Click "Forgot your password?"
3. Enter your email
4. Check inbox for password reset email
5. Click reset link
6. Set new password
7. Verify successful login

### Test 3: Resend Dashboard Logs

1. Go to Resend dashboard
2. Click **Logs** in sidebar
3. Verify emails are being sent successfully
4. Check delivery status and open rates

## Step 7: Environment Variables Setup

### Local Development (.env.local)

```bash
# Add to frontend/.env.local
RESEND_API_KEY=re_your_test_api_key_here

# Supabase is configured via supabase/config.toml for local dev
```

### Production Deployment (Vercel/Netlify)

Set these environment variables in your deployment platform:

```bash
RESEND_API_KEY=re_your_production_api_key_here
```

**Vercel CLI:**
```bash
vercel env add RESEND_API_KEY production
# Paste your Resend API key when prompted
```

**Netlify:**
1. Go to Site Settings > Environment Variables
2. Add key: `RESEND_API_KEY`
3. Add value: `re_your_production_api_key_here`
4. Save

## Step 8: Update Supabase Remote Project

For your hosted Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** > **API**
4. Copy your project URL and keys
5. Update environment variables in production

OR use Supabase CLI:

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Push SMTP config
npx supabase db push
```

## Troubleshooting

### Issue: Emails not sending

**Check 1: Resend API Key**
- Verify key starts with `re_`
- Ensure it hasn't been revoked
- Check Resend dashboard for errors

**Check 2: Domain Verification**
```bash
# Check DNS records
dig TXT yourdomain.com
dig TXT resend._domainkey.yourdomain.com
```

**Check 3: Supabase Logs**
```bash
# View Supabase auth logs
npx supabase functions logs --project-ref your-ref
```

### Issue: Emails going to spam

**Solutions:**
1. **Verify domain** in Resend (required for production)
2. **Set up DMARC** policy
3. **Warm up your domain**: Start with low volume, gradually increase
4. **Avoid spam triggers**: Don't use ALL CAPS, excessive punctuation
5. **Include unsubscribe link** (for transactional emails, optional)

### Issue: Rate limiting

Resend free tier limits:
- **3,000 emails/month**
- **10 emails/second** burst

If you hit limits:
- Upgrade to Resend Pro ($20/month for 50k emails)
- Implement email queuing
- Add rate limiting on signup endpoints

## Security Best Practices

### 1. Rotate API Keys Regularly

```bash
# Every 90 days, generate new key in Resend dashboard
# Update in Supabase dashboard
# Update in deployment platform env vars
# Revoke old key in Resend
```

### 2. Use Different Keys for Environments

```
Development:  re_dev_xxxxx
Staging:      re_staging_xxxxx
Production:   re_prod_xxxxx
```

### 3. Monitor Email Activity

Set up alerts in Resend for:
- High bounce rates (>5%)
- Spam complaints
- Unusual sending patterns

### 4. Never Commit API Keys

```bash
# .gitignore should include:
.env
.env.local
.env*.local
**/config.local.toml
```

## Advanced: Programmatic Email Sending

If you want to send custom emails from your app (not just auth emails):

### Install Resend SDK

```bash
cd frontend
npm install resend
```

### Create Email Utility

Create `frontend/lib/email/resend.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SmartSlate Polaris <noreply@yourdomain.com>',
      to: [to],
      subject: 'Welcome to SmartSlate Polaris',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining SmartSlate Polaris.</p>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}
```

### Use in API Route

Create `frontend/app/api/emails/welcome/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const fullName = `${profile?.first_name} ${profile?.last_name}`;

    // Send welcome email
    const result = await sendWelcomeEmail(user.email!, fullName);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Welcome email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Monitoring and Analytics

### Resend Dashboard Metrics

Track in Resend dashboard:
- **Delivery rate**: Should be >95%
- **Open rate**: Industry average ~20-25%
- **Bounce rate**: Should be <5%
- **Spam complaints**: Should be <0.1%

### Set Up Webhooks (Advanced)

Get real-time notifications for email events:

1. In Resend dashboard, go to **Webhooks**
2. Create webhook endpoint in your app
3. Configure events to listen for:
   - `email.delivered`
   - `email.bounced`
   - `email.complained`

Create `frontend/app/api/webhooks/resend/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const signature = headersList.get('resend-signature');

  // Verify webhook signature
  // Implementation depends on Resend's webhook verification method

  const payload = await request.json();

  // Handle different event types
  switch (payload.type) {
    case 'email.delivered':
      console.log('Email delivered:', payload.data.email_id);
      break;
    case 'email.bounced':
      console.log('Email bounced:', payload.data.email_id);
      // Update user record, flag email as invalid
      break;
    case 'email.complained':
      console.log('Spam complaint:', payload.data.email_id);
      // Unsubscribe user, investigate content
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Quick Reference

### SMTP Settings Summary

| Setting | Value |
|---------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Your Resend API Key (`re_...`) |
| Sender Email | Must match verified domain |
| Encryption | SSL/TLS |

### Resend Limits (Free Tier)

| Metric | Limit |
|--------|-------|
| Emails/month | 3,000 |
| Emails/second | 10 burst |
| Domains | 1 verified domain |
| API Keys | Unlimited |

### Useful Commands

```bash
# Test Resend API connection
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Testing Resend SMTP</p>"
  }'

# Check Supabase SMTP config
npx supabase status

# View Supabase logs
npx supabase logs
```

## Next Steps

1. ✅ Set up Resend account
2. ✅ Configure Supabase SMTP
3. ✅ Test email delivery
4. ✅ Verify domain (production)
5. ✅ Customize email templates
6. 🔄 Implement forgot password page
7. 🔄 Add email verification flow
8. 🔄 Set up monitoring alerts

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [SMTP Configuration Guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Best Practices](https://resend.com/docs/knowledge-base/best-practices)

---

**Need Help?**
- Resend Support: support@resend.com
- Supabase Discord: discord.supabase.com
- Check logs: Resend Dashboard > Logs
