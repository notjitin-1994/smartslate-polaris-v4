# Email Debugging Guide

## ✅ ROOT CAUSE FIXED

**Issue**: Email API routes were returning HTML 404 pages instead of JSON responses because the route files didn't exist.

**Error Message**:
```
[FEEDBACK] Failed to call email API: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Fix Applied**: Created all missing API route files and email templates:

## Changes Made

### Created Files:

1. **frontend/app/api/feedback/submit/route.ts** ✅
   - Complete implementation with authentication, validation, database insertion
   - Async email notification with enhanced logging
   - Logs: `[FEEDBACK] Email sent successfully:` or `[FEEDBACK] Email API returned error:`

2. **frontend/app/api/feedback/send-email/route.ts** ✅
   - Resend email client with lazy initialization
   - React Email template rendering
   - Detailed Resend API error logging (name, message, statusCode)
   - Logs: `[FEEDBACK EMAIL] Resend API error:` or `[FEEDBACK EMAIL] Email sent successfully via Resend:`

3. **frontend/app/api/feature-requests/submit/route.ts** ✅
   - Same pattern as feedback submit route
   - Feature request database insertion
   - Async email notification
   - Logs: `[FEATURE REQUEST] Email sent successfully:` or `[FEATURE REQUEST] Email API returned error:`

4. **frontend/app/api/feature-requests/send-email/route.ts** ✅
   - Feature request email sending via Resend
   - Detailed error logging
   - Logs: `[FEATURE REQUEST EMAIL] Resend API error:` or `[FEATURE REQUEST EMAIL] Email sent successfully via Resend:`

5. **frontend/emails/FeedbackNotification.tsx** ✅
   - Professional React Email template for feedback notifications
   - Sentiment-based styling (positive/neutral/negative)
   - User information and message display

6. **frontend/emails/FeatureRequestNotification.tsx** ✅
   - Professional React Email template for feature requests
   - Priority-based styling (low/medium/high)
   - Category-based icons
   - Title, description, and user information

### Previously Updated Files:

1. **frontend/app/api/feedback/submit/route.ts**
   - Enhanced error logging to show email API response details
   - Logs: `[FEEDBACK] Email sent successfully:` or `[FEEDBACK] Email API returned error:`

2. **frontend/app/api/feature-requests/submit/route.ts**
   - Enhanced error logging to show email API response details
   - Logs: `[FEATURE REQUEST] Email sent successfully:` or `[FEATURE REQUEST] Email API returned error:`

3. **frontend/app/api/feedback/send-email/route.ts**
   - Detailed Resend API error logging
   - Shows error name, message, statusCode, and full error object
   - Logs: `[FEEDBACK EMAIL] Resend API error:` or `[FEEDBACK EMAIL] Email sent successfully via Resend:`

4. **frontend/app/api/feature-requests/send-email/route.ts**
   - Detailed Resend API error logging
   - Shows error name, message, statusCode, and full error object
   - Logs: `[FEATURE REQUEST EMAIL] Resend API error:` or `[FEATURE REQUEST EMAIL] Email sent successfully via Resend:`

---

## ✅ System Status

**Dev Server**: Running on http://localhost:3002
**Compilation**: ✅ No errors
**API Routes**: ✅ All created
**Email Templates**: ✅ All created

## How to Test

### Step 1: Dev Server is Already Running

The dev server is currently running on **http://localhost:3002**. If you need to restart it:

```bash
cd frontend
npm run dev
```

### Step 2: Submit Feedback

1. Navigate to **http://localhost:3002**
2. Sign in with your account
3. Scroll to the feedback card on the homepage
4. Submit feedback or feature request

### Step 3: Check Terminal Logs

Watch your terminal for these log messages:

**Success Pattern:**
```
[FEEDBACK] Email sent successfully: { success: true, emailId: 'xxx-xxx-xxx' }
[FEEDBACK EMAIL] Email sent successfully via Resend: xxx-xxx-xxx
```

**Error Pattern:**
```
[FEEDBACK] Email API returned error: 500 { error: 'Failed to send email', details: {...} }
[FEEDBACK EMAIL] Resend API error: { name: '...', message: '...', ... }
```

---

## Common Resend Errors

### 1. Domain Not Verified
```json
{
  "name": "validation_error",
  "message": "The domain 'smartslate.io' is not verified"
}
```

**Solution**:
- Go to https://resend.com/domains
- Verify smartslate.io domain
- Add required DNS records (SPF, DKIM, MX)
- Wait 15 minutes for verification

**Temporary Workaround**:
- Use `onboarding@resend.dev` as sender (already configured in code)

### 2. Invalid API Key
```json
{
  "name": "authentication_error",
  "message": "Invalid API key"
}
```

**Solution**:
- Check `RESEND_API_KEY` in `frontend/.env.local`
- Get valid key from https://resend.com/api-keys

### 3. Rate Limit Exceeded
```json
{
  "name": "rate_limit_error",
  "message": "Too many requests"
}
```

**Solution**:
- Wait a few minutes
- Upgrade Resend plan if on free tier

### 4. Missing Required Field
```json
{
  "name": "missing_required_field",
  "message": "Missing 'from' field"
}
```

**Solution**:
- Check email route has all required fields (from, to, subject, html)

---

## Testing Email Endpoint Directly

If you want to test the email endpoint directly (bypassing authentication):

```bash
curl -X POST http://localhost:3002/api/feedback/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackId": "test-123",
    "userId": "test-user",
    "userEmail": "test@example.com",
    "sentiment": "positive",
    "category": "feature",
    "message": "Test feedback message",
    "contactEmail": "test@example.com",
    "timestamp": "2025-11-10T12:00:00Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "emailId": "xxx-xxx-xxx"
}
```

---

## Verification Checklist

- [ ] RESEND_API_KEY is set in frontend/.env.local
- [ ] Dev server is running (npm run dev)
- [ ] Submitted feedback/feature request
- [ ] Checked terminal logs for error messages
- [ ] Identified specific Resend error (if any)
- [ ] Applied solution based on error type

---

## Next Steps After Finding Error

Once you see the error in the logs, we can:

1. **Domain Verification Issue**: Verify domain or use onboarding@resend.dev
2. **API Key Issue**: Update RESEND_API_KEY with valid key
3. **Rate Limit**: Wait or upgrade plan
4. **Other Errors**: Debug based on specific error message

---

## Current Configuration

- **From Address**: Smartslate Polaris <noreply@smartslate.io>
- **To Address**: jitin@smartslate.io
- **API Key**: Set in .env.local (RESEND_API_KEY)
- **Email Templates**: React Email templates in frontend/emails/

---

## Contact

If you see an error you don't understand, share the log output and we can debug further.
