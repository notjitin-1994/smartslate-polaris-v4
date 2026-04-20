# Razorpay Manual Setup Guide

**Task**: Razorpay Payment Gateway Integration - Account Setup
**Date**: October 29, 2025
**Status**: Manual Action Required
**Estimated Time**: 3-4 days (including KYC approval wait time)

---

## Overview

This document provides step-by-step instructions for completing the **manual setup** portions of the Razorpay integration. These steps cannot be automated and must be completed by a developer with business authority.

**Prerequisites**:
- Valid business PAN card
- GST registration certificate
- Bank account details for settlement
- Company registration documents
- Authorized signatory details

---

## Subtask 1.1: Create Razorpay Business Account

### Step 1: Navigate to Razorpay Website

1. Open your web browser
2. Go to: **https://razorpay.com/**
3. Click on **"Sign Up"** button (top right)

### Step 2: Choose Account Type

1. Select **"Business Account"** (NOT Personal)
2. This is important - personal accounts cannot access subscriptions feature

### Step 3: Complete Registration Form

Fill in the following details:

**Business Information**:
- **Company Name**: SmartSlate Technologies (or your business name)
- **Business Type**: Select from dropdown (e.g., Private Limited, LLP, Partnership)
- **Website URL**: https://polaris.smartslate.io (or your domain)

**Contact Information**:
- **Business Email**: Use company email (NOT personal Gmail/Yahoo)
- **Phone Number**: Primary business contact number
- **Create Password**: Strong password (min 8 chars, uppercase, lowercase, number, special char)

### Step 4: Email Verification

1. Check your email inbox
2. You'll receive an email from **noreply@razorpay.com**
3. Click the **"Verify Email"** link
4. **Timeout**: Link expires in 24 hours

### Step 5: Phone Number Verification

1. You'll receive an OTP via SMS to your registered phone
2. Enter the 6-digit OTP in the verification screen
3. Click **"Verify"**
4. **Retry**: If you don't receive OTP in 2 minutes, click "Resend OTP"

### Step 6: Set Security Settings

1. Enable **Two-Factor Authentication (2FA)** (HIGHLY RECOMMENDED)
2. Set security questions and answers
3. Save your recovery codes in a secure location (password manager)

### Step 7: Login to Dashboard

1. Use your email and password to login
2. URL: **https://dashboard.razorpay.com/**
3. You should see the Razorpay dashboard homepage

**✅ Verification**: You can successfully login to Razorpay dashboard and see account status as "Active but not verified"

---

## Subtask 1.2: Complete KYC Verification

**⚠️ CRITICAL**: This process takes 24-48 hours. Do NOT proceed to API key generation until KYC is approved.

### Step 1: Access KYC Section

1. Login to Razorpay dashboard: https://dashboard.razorpay.com/
2. Navigate to **Settings** (⚙️ icon on left sidebar)
3. Click **Account & Settings**
4. Go to **KYC Details** tab

### Step 2: Prepare Required Documents

**Document Checklist**:
- [ ] **PAN Card** (Business PAN or Individual PAN if sole proprietor)
  - Format: High-resolution image (JPG/PNG)
  - Size: Max 5MB
  - Must be clearly readable

- [ ] **GST Registration Certificate**
  - Format: PDF or high-resolution image
  - Must show GSTIN number
  - Must match business name

- [ ] **Bank Account Proof**
  - Cancelled cheque showing account number and IFSC
  - OR Bank statement (last 3 months)
  - Must show company/business name

- [ ] **Business Registration Documents**
  - Certificate of Incorporation (for companies)
  - Partnership deed (for partnerships)
  - LLP Agreement (for LLPs)
  - Shop & Establishment License (for proprietorships)

- [ ] **Proof of Address**
  - Utility bill (electricity, water, gas) - less than 3 months old
  - Rent agreement with owner's signature
  - Property tax receipt

### Step 3: Fill Business Verification Form

**Business Details**:
- **Legal Business Name**: Must match PAN and GST
- **Business Address**: Complete address with pincode
- **Business Category**: Select appropriate category (e.g., "SaaS/Technology")
- **Business Sub-category**: "Educational Technology" or "Software Services"
- **Estimated Monthly Turnover**: Realistic estimate (e.g., ₹5-10 lakhs)

**Authorized Signatory Details**:
- **Name**: Full name as per PAN
- **Designation**: CEO / Director / Proprietor
- **Email**: Official email
- **Phone**: Direct contact number
- **PAN Number**: Enter PAN without spaces
- **Aadhaar Number**: (Optional but recommended for faster approval)

### Step 4: Upload Documents

For EACH document:
1. Click **"Upload"** button
2. Select file from your computer
3. Ensure image is clear and all corners visible
4. Wait for upload confirmation (green checkmark)

**Common Upload Errors**:
- ❌ File too large (max 5MB) - Compress image
- ❌ Invalid format - Use JPG, PNG, or PDF only
- ❌ Poor quality - Retake photo with good lighting
- ❌ Cropped edges - Include full document in frame

### Step 5: Submit for Verification

1. Review all entered information carefully
2. Check all documents uploaded correctly
3. Accept terms and conditions
4. Click **"Submit for Verification"**

### Step 6: Wait for Approval

**Timeline**: 24-48 business hours (Monday-Friday, 9 AM - 6 PM IST)

**Status Tracking**:
1. You'll receive email updates at each stage:
   - "Application Received"
   - "Under Review"
   - "Additional Information Required" (if any)
   - "KYC Approved" ✅

2. Check dashboard status:
   - Login to https://dashboard.razorpay.com/
   - Settings → Account & Settings → KYC Status

**If Additional Information Requested**:
- Razorpay team will email you within 24 hours
- Respond promptly (within 24 hours) with requested documents
- Delays in response extend approval time

**✅ Verification**: KYC status shows **"Verified"** in Razorpay dashboard with green checkmark

---

## Subtask 1.3: Generate API Keys and Configure Settings

**⚠️ PREREQUISITE**: Complete Subtask 1.2 (KYC Verification must show "Approved")

### Step 1: Generate Test Mode API Keys

1. Login to Razorpay dashboard: https://dashboard.razorpay.com/
2. Navigate to **Settings** (⚙️ icon)
3. Click **API Keys** in left menu
4. You'll see two tabs: **Test Mode** and **Live Mode**
5. Stay in **Test Mode** tab (we'll generate live keys later)

**Generate Test Keys**:
1. Click **"Generate Test Key"** button
2. You'll see two keys generated:
   - **Key ID**: Starts with `rzp_test_` (e.g., `rzp_test_1DP5mmOlF5G5ag`)
   - **Key Secret**: Hidden by default, click "eye" icon to reveal

3. **IMPORTANT**: Copy BOTH keys immediately
   - Click **"Copy"** button next to each key
   - Paste into a secure location (password manager or local file)
   - You **cannot** retrieve the Key Secret later - it will be masked

**Security Notes**:
- ⚠️ **NEVER** commit API keys to GitHub or version control
- ⚠️ **NEVER** share Key Secret publicly
- ⚠️ **Key ID** is safe for client-side (frontend) use
- ⚠️ **Key Secret** must ONLY be used server-side

### Step 2: Enable Subscriptions Feature

1. From Razorpay dashboard, navigate to **Products** (left sidebar)
2. Click **Subscriptions**
3. You'll see "Subscriptions" product page
4. Click **"Activate Subscriptions"** button
5. Fill in basic details:
   - **Business Category**: SaaS/Technology
   - **Expected Monthly Subscriptions**: Realistic estimate (e.g., 50-100)
   - **Average Subscription Value**: e.g., ₹3000

6. Click **"Activate"**
7. **✅ Confirmation**: You'll see "Subscriptions Activated" message

**Test Subscriptions Feature**:
- Go to **Subscriptions** → **Plans**
- You should be able to create test plans
- If you see "Activate Subscriptions" still, contact Razorpay support

### Step 3: Configure Webhook Settings

**What are webhooks?**: Razorpay sends real-time notifications to your server when payment events occur (payment success, subscription activated, payment failed, etc.)

**Configuration Steps**:

1. Navigate to **Settings** → **Webhooks**
2. Click **"Create New Webhook"** button

**Webhook Setup Form**:

**Webhook URL**:
- **For Development/Testing**:
  - If using ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
  - If using Vercel preview: `https://your-preview.vercel.app/api/webhooks/razorpay`
- **For Production**: `https://polaris.smartslate.io/api/webhooks/razorpay`

**Select Events** (Check ALL of these):
- ✅ `subscription.activated`
- ✅ `subscription.charged`
- ✅ `subscription.completed`
- ✅ `subscription.cancelled`
- ✅ `subscription.halted`
- ✅ `subscription.paused`
- ✅ `payment.authorized`
- ✅ `payment.captured`
- ✅ `payment.failed`

**Active Status**: Enable (toggle ON)

**Save Webhook**:
1. Click **"Create Webhook"**
2. You'll see the webhook listed
3. **CRITICAL**: Copy the **Webhook Secret**
   - It looks like: `whsec_XXXXXXXXXXXX`
   - Click "eye" icon to reveal
   - Copy immediately - cannot retrieve later
   - Store securely with API keys

**Test Webhook** (Optional but recommended):
1. Click the webhook you just created
2. Click **"Send Test Webhook"** button
3. Select an event type (e.g., `subscription.activated`)
4. Click **"Send"**
5. Check if your server receives the webhook (check logs)

**✅ Verification**: Webhook shows "Active" status and secret is saved

### Step 4: Save Credentials to Environment Variables

**Create/Update** `frontend/.env.local`:

```bash
# Razorpay API Credentials (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX    # Replace with your actual Test Key ID
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY                  # Replace with your actual Test Key Secret

# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=whsec_ZZZZZZZZZZZZZZ         # Replace with your actual Webhook Secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000              # Change for production

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true                       # Enable payment features
```

**⚠️ SECURITY CHECKLIST**:
- [ ] `.env.local` is listed in `.gitignore`
- [ ] No API keys committed to version control
- [ ] All secrets stored in password manager
- [ ] Team members have separate test keys (not sharing)

### Step 5: Verify Installation

Run this test in your terminal:

```bash
cd frontend

# Check if environment variables load correctly
node -e "console.log('Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)"
# Should output: Key ID: rzp_test_XXXXXXXXXXXXX

# Verify key is NOT exposed to client (should be undefined)
node -e "console.log('Secret:', process.env.RAZORPAY_KEY_SECRET)"
# Should output: Secret: YYYYYYYYYYYYYYYY
```

**✅ Final Verification Checklist**:
- [ ] Razorpay account created and active
- [ ] KYC status shows "Verified"
- [ ] Test mode API keys generated (Key ID + Key Secret)
- [ ] Subscriptions feature activated
- [ ] Webhook configured with correct URL and events
- [ ] Webhook secret copied and saved
- [ ] All credentials added to `frontend/.env.local`
- [ ] Environment variables load correctly
- [ ] `.env.local` not committed to git

---

## Next Steps (Automated Implementation)

Once you've completed all manual steps above (Subtasks 1.1, 1.2, 1.3), the automated agent will proceed with:

✅ **Subtask 1.4**: Install Razorpay NPM Dependencies
- `razorpay@^2.9.4`
- `@types/razorpay@^2.0.0`

✅ **Subtask 1.5**: Configure Environment Variables Template
- Update `.env.example` with Razorpay variables
- Add documentation for each variable

These automated tasks do NOT require any manual action and will be completed by the AI agent.

---

## Troubleshooting

### Issue: KYC Verification Rejected

**Possible Reasons**:
- Documents not clear/readable
- Name mismatch between PAN, GST, and bank account
- Incomplete business address
- Invalid business category

**Solution**:
1. Check rejection email for specific reason
2. Re-upload corrected documents
3. Ensure all names match exactly across documents
4. Resubmit for verification

### Issue: Cannot Generate API Keys

**Reason**: KYC not approved yet

**Solution**:
- Wait for KYC approval email
- Check dashboard for KYC status
- Contact Razorpay support if delayed beyond 48 hours

### Issue: Webhook Secret Not Showing

**Reason**: Already created webhook and didn't save secret

**Solution**:
- Delete existing webhook
- Create new webhook
- Copy secret immediately when shown

### Issue: Test Payments Not Working

**Possible Reasons**:
- Using live keys instead of test keys
- Incorrect key ID or secret
- Subscriptions feature not activated

**Solution**:
- Verify you're using `rzp_test_` keys (not `rzp_live_`)
- Check API keys are correctly set in `.env.local`
- Ensure subscriptions feature shows "Activated" in dashboard

---

## Support Contacts

**Razorpay Support**:
- Email: support@razorpay.com
- Phone: 080-71834934 (Mon-Fri, 10 AM - 7 PM IST)
- Live Chat: https://dashboard.razorpay.com/ (bottom right corner)

**Documentation**:
- Integration Guide: `/docs/RAZORPAY_INTEGRATION_GUIDE.md`
- Official Docs: https://razorpay.com/docs/
- API Reference: https://razorpay.com/docs/api/

---

**Last Updated**: October 29, 2025
**Reviewer**: Integration Team
**Next Review**: After KYC approval confirmation
