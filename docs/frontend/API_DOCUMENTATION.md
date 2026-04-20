# API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the SmartSlate Dynamic Questionnaire System.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via Supabase. The authentication token is automatically handled by the Supabase client via cookies.

### Authentication Error Responses

All protected endpoints may return:

- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - Valid token but insufficient permissions

---

## Static Questionnaire API

### Save Questionnaire

**POST** `/api/questionnaire/save`

Saves the static questionnaire responses and creates or updates a blueprint record with usage limit enforcement.

#### Request Body

```typescript
{
  "staticAnswers": {               // Required
    "learningObjective": "string",
    "targetAudience": "string",
    "deliveryMethod": "string",
    "duration": "string",
    "assessmentType": "string"
  },
  "blueprintId": "uuid"           // Optional - creates new if not provided
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "blueprintId": "uuid",
  "message": "Questionnaire saved" | "Questionnaire updated"
}
```

#### Error Responses

- `400 Bad Request` - Missing staticAnswers or invalid data
- `401 Unauthorized` - Not authenticated
- `429 Too Many Requests` - Blueprint creation limit exceeded
- `500 Internal Server Error` - Database error

---

## User Account APIs

### Get User Usage

**GET** `/api/user/usage`

Retrieves current blueprint usage statistics and limits for the authenticated user.

#### Response (200 OK)

```typescript
{
  "success": true,
  "usage": {
    "creationCount": number,
    "savingCount": number,
    "creationLimit": number,
    "savingLimit": number,
    "creationRemaining": number,
    "savingRemaining": number,
    "isExempt": boolean,
    "exemptionReason"?: string,
    "subscriptionTier": "free" | "explorer" | "navigator" | "voyager" | "crew" | "fleet" | "armada"
  }
}
```

#### Error Responses

- `401 Unauthorized` - Not authenticated

### Get User Sessions

**GET** `/api/account/sessions`

Retrieves all active sessions for the authenticated user.

#### Response (200 OK)

```typescript
{
  "sessions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "createdAt": "ISO timestamp",
      "lastAccessAt": "ISO timestamp",
      "ipAddress": "string",
      "userAgent": "string",
      "isActive": boolean
    }
  ]
}
```

### Change Password

**POST** `/api/account/password/change`

Changes the user's password after validating the current password.

#### Request Body

```typescript
{
  "currentPassword": "string",     // Required
  "newPassword": "string",         // Required - must meet password policy
  "confirmPassword": "string"      // Required - must match newPassword
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Error Responses

- `400 Bad Request` - Invalid passwords or mismatch
- `401 Unauthorized` - Current password incorrect
- `422 Unprocessable Entity` - New password doesn't meet requirements

### Delete Account

**POST** `/api/account/delete`

Permanently deletes the user's account and all associated data after confirmation.

#### Request Body

```typescript
{
  "password": "string",            // Required - current password for confirmation
  "confirmation": "DELETE"         // Required - exact string to confirm deletion
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### Error Responses

- `400 Bad Request` - Missing confirmation or incorrect password
- `401 Unauthorized` - Not authenticated
- `422 Unprocessable Entity` - Account deletion restrictions apply

---

## Admin Management APIs

### Grant Admin Access

**POST** `/api/admin/grant-access`

Grants admin or developer role and subscription tier to a user by email. Requires service role authentication.

#### Request Body

```typescript
{
  "email": "string",               // Required - user email address
  "role": "user" | "developer" | "admin",  // Optional, default: "developer"
  "tier": "free" | "explorer" | "navigator" | "voyager" | "crew" | "fleet" | "armada"  // Optional, default: "free"
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Successfully granted {role} role and {tier} tier to {email}",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "string",
    "tier": "string",
    "full_name": "string",
    "blueprint_creation_limit": number,
    "blueprint_saving_limit": number
  },
  "changes": {
    "role": { "old": "string", "new": "string" },
    "tier": { "old": "string", "new": "string" }
  }
}
```

#### Error Responses

- `400 Bad Request` - Invalid email, role, or tier
- `404 Not Found` - User not found (must sign up first)
- `500 Internal Server Error` - Database error

### Revoke Admin Access

**DELETE** `/api/admin/grant-access`

Revokes admin access and resets user to free tier.

#### Request Body

```typescript
{
  "email": "string"                // Required - user email address
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Successfully revoked admin access from {email}",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "user",
    "tier": "free"
  }
}
```

### List Users

**GET** `/api/admin/users`

Retrieves paginated list of all users with filtering and search capabilities. Requires admin authentication.

#### Query Parameters

- `search` (string) - Search term for email/name
- `role` (string) - Filter by user role
- `tier` (string) - Filter by subscription tier
- `status` (string) - Filter by account status ("active", "inactive", "deleted", "all")
- `page` (number) - Page number (default: 1)
- `limit` (number) - Results per page (default: 50, max: 100)
- `sortBy` (string) - Sort field (email, created_at, etc.)
- `sortOrder` (string) - Sort order ("asc", "desc")

#### Response (200 OK)

```typescript
{
  "users": [
    {
      "user_id": "uuid",
      "email": "string",
      "full_name": "string" | null,
      "user_role": "string",
      "subscription_tier": "string",
      "blueprint_creation_count": number,
      "blueprint_creation_limit": number,
      "blueprint_saving_count": number,
      "blueprint_saving_limit": number,
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp",
      "last_sign_in_at": "ISO timestamp" | null,
      "deleted_at": "ISO timestamp" | null,
      "_hasProfile": boolean
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  },
  "filters": {
    "search": "string",
    "role": "string",
    "tier": "string",
    "status": "string"
  }
}
```

#### Error Responses

- `401 Unauthorized` - Not authenticated or insufficient permissions
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Database error

### Bulk User Operations

**POST** `/api/admin/users`

Performs bulk operations on multiple users. Requires admin authentication.

#### Request Body

```typescript
{
  "action": "bulk_update_role" | "bulk_update_tier" | "bulk_delete",
  "userIds": "uuid[]",             // Required - array of user IDs
  "data": {                        // Required for update actions
    "role": "string",              // For bulk_update_role
    "tier": "string"               // For bulk_update_tier
  }
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Updated role for {count} users" | "Updated tier for {count} users" | "Deleted {count} users",
  "updated": number | "deleted": number
}
```

### Get Admin Metrics

**GET** `/api/admin/metrics`

Retrieves system-wide metrics and analytics. Requires admin authentication.

#### Response (200 OK)

```typescript
{
  "users": {
    "total": number,
    "active": number,
    "newThisMonth": number,
    "byTier": { "free": number, "explorer": number, ... },
    "byRole": { "user": number, "developer": number, "admin": number }
  },
  "blueprints": {
    "total": number,
    "completed": number,
    "inProgress": number,
    "averageGenerationTime": number
  },
  "subscriptions": {
    "active": number,
    "revenue": { "monthly": number, "yearly": number },
    "churnRate": number
  }
}
```

---

## Razorpay Payment APIs

### Create Subscription

**POST** `/api/subscriptions/create-subscription`

Creates a new Razorpay subscription with comprehensive validation and duplicate prevention.

#### Request Body

```typescript
{
  "tier": "navigator" | "voyager" | "crew" | "fleet" | "armada",  // Required
  "billingCycle": "monthly" | "yearly",                           // Required
  "seats": number,                                               // Optional - required for team tiers
  "customerInfo": {                                               // Optional
    "name": "string",
    "email": "string",
    "contact": "string"
  },
  "metadata": {                                                   // Optional
    "key": "value"
  }
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    "message": "Subscription created successfully",
    "subscription": {
      "subscriptionId": "string",
      "customerId": "string",
      "shortUrl": "string",
      "status": "string",
      "planName": "string",
      "planAmount": number,
      "planCurrency": "string",
      "billingCycle": "string",
      "nextBillingDate": "ISO timestamp",
      "currentStart": "ISO timestamp",
      "tier": "string",
      "seats": number,
      "customerName": "string",
      "customerEmail": "string"
    }
  },
  "requestId": "string"
}
```

#### Error Responses

- `400 Bad Request` - Invalid parameters, validation errors, or duplicate subscription
- `401 Unauthorized` - Authentication required
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Razorpay or database error

### Cancel Subscription

**POST** `/api/subscriptions/cancel`

Cancels an active subscription with immediate effect.

#### Request Body

```typescript
{
  "subscriptionId": "string"       // Required
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

### Verify Payment

**POST** `/api/subscriptions/verify-payment`

Verifies a successful payment and updates subscription status.

#### Request Body

```typescript
{
  "paymentId": "string",           // Required - Razorpay payment ID
  "subscriptionId": "string",      // Required
  "signature": "string"            // Required - Razorpay signature
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Payment verified successfully",
  "subscription": {
    "status": "active",
    "paidCount": number,
    "nextBillingDate": "ISO timestamp"
  }
}
```

---

## Razorpay Webhooks

### Process Webhook Events

**POST** `/api/webhooks/razorpay`

Main webhook endpoint for processing Razorpay events with signature verification and comprehensive event handling.

#### Security

- Signature verification using Razorpay webhook secret
- Rate limiting (100 requests per minute per IP)
- Idempotency checking to prevent duplicate processing
- Comprehensive logging and audit trails

#### Event Types Supported

**Subscription Events:**
- `subscription.created` - New subscription created
- `subscription.authenticated` - Subscription authenticated
- `subscription.activated` - Subscription activated
- `subscription.completed` - Subscription completed
- `subscription.cancelled` - Subscription cancelled
- `subscription.paused` - Subscription paused
- `subscription.resumed` - Subscription resumed
- `subscription.charged` - Payment successful
- `subscription.charge.failed` - Payment failed
- `subscription.pending` - Payment pending

**Payment Events:**
- `payment.captured` - Payment captured successfully
- `payment.failed` - Payment failed
- `payment.paid` - Payment completed

#### Request Headers

```
X-Razorpay-Signature: string      // Required - webhook signature
Content-Type: application/json
```

#### Request Body

Event payload from Razorpay (varies by event type)

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Webhook processed successfully",
  "timestamp": "ISO timestamp",
  "requestId": "string",
  "eventId": "string",
  "eventType": "string",
  "processingTime": number,
  "details": {
    "subscriptionId": "string",
    "paymentId": "string",
    "action": "string",
    "metadata": {}
  }
}
```

#### Response (200 OK) - Duplicate Event

```typescript
{
  "success": true,
  "message": "Duplicate event acknowledged",
  "timestamp": "ISO timestamp",
  "requestId": "string",
  "eventId": "string",
  "status": "duplicate"
}
```

#### Error Responses

- `400 Bad Request` - Invalid webhook payload or signature
- `401 Unauthorized` - Signature verification failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Processing error

#### Health Check

**GET** `/api/webhooks/razorpay`

Returns webhook service health status and statistics.

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Webhook service is healthy",
  "timestamp": "ISO timestamp",
  "service": "razorpay-webhook-handler",
  "version": "1.0.0",
  "statistics": {
    "router": {
      "registeredHandlers": number,
      "enabledHandlers": number
    },
    "logging": {
      "totalLogs": number,
      "errorRate": number,
      "averageProcessingTime": number
    }
  }
}
```

---

## Dynamic Questions API

### Generate Dynamic Questions

**POST** `/api/generate-dynamic-questions`

Generates a dynamic questionnaire based on static answers using Claude AI (with Sonnet 4 fallback).

#### Request Body

```typescript
{
  "blueprintId": "uuid",           // Required
  "staticAnswers": {               // Required
    "learningObjective": "string",
    "targetAudience": "string",
    "deliveryMethod": "string",
    "duration": "string",
    "assessmentType": "string"
  },
  "userPrompts": ["string"]        // Optional
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "sections": [
    {
      "id": "s1",
      "title": "string",
      "description": "string",
      "order": 1,
      "questions": [
        {
          "id": "q1_s1",
          "label": "string",
          "type": "text|textarea|select|radio_pills|...",
          "required": boolean,
          "helpText": "string",
          "placeholder": "string",
          "options": [{"value": "string", "label": "string"}],
          "metadata": {}
        }
      ]
    }
  ],
  "metadata": {
    "generatedAt": "ISO timestamp",
    "model": "claude-sonnet-4.5|claude-sonnet-4",
    "fallbackUsed": boolean
  }
}
```

#### Error Responses

- `400 Bad Request` - Invalid request body or missing required fields
- `404 Not Found` - Blueprint not found
- `500 Internal Server Error` - Generation failed

---

### Get Dynamic Questions

**GET** `/api/dynamic-questions/:blueprintId`

Retrieves generated dynamic questions and existing answers for a blueprint.

#### URL Parameters

- `blueprintId` (uuid, required) - The blueprint ID

#### Response (200 OK)

```typescript
{
  "questions": {
    "sections": [...],  // Dynamic questions schema
    "metadata": {}
  },
  "answers": {
    "s1_q1": "answer value",
    ...
  },
  "status": "generating|answering|completed"
}
```

#### Error Responses

- `400 Bad Request` - Invalid blueprint ID format
- `404 Not Found` - Blueprint not found or no questions generated
- `401 Unauthorized` - Not authenticated

---

## Dynamic Answers API

### Save Answers (Auto-save)

**POST** `/api/dynamic-answers/save`

Auto-saves partial answers without validation. Used for debounced auto-save functionality.

#### Request Body

```typescript
{
  "blueprintId": "uuid",           // Required
  "answers": {                     // Required
    "s1_q1": "any value",
    "s2_q3": "any value"
  },
  "sectionId": "string"            // Optional - tracks current section
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "saved": {
    "answersCount": number,
    "timestamp": "ISO timestamp"
  }
}
```

#### Error Responses

- `400 Bad Request` - Invalid request body
- `404 Not Found` - Blueprint not found
- `401 Unauthorized` - Not authenticated

---

### Submit Answers (Final)

**POST** `/api/dynamic-answers/submit`

Submits complete answers with validation and triggers blueprint generation.

#### Request Body

```typescript
{
  "blueprintId": "uuid",           // Required
  "answers": {                     // Required, must pass validation
    "s1_q1": "value",
    "s1_q2": "value"
    // ... all required answers
  }
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "blueprintId": "uuid",
  "status": "generating",
  "submitted": {
    "timestamp": "ISO timestamp",
    "answerCount": number
  }
}
```

#### Error Responses

- `400 Bad Request` - Validation failed or incomplete answers
- `404 Not Found` - Blueprint not found or no dynamic questions
- `401 Unauthorized` - Not authenticated

---

## Blueprint API

### Generate Blueprint

**POST** `/api/blueprints/generate`

Generates a learning blueprint using Claude AI (Sonnet 4.5 primary, Sonnet 4 fallback) based on static and dynamic answers.

#### Request Body

```typescript
{
  "blueprintId": "uuid"            // Required
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "blueprintId": "uuid",
  "metadata": {
    "model": "claude-sonnet-4.5|claude-sonnet-4",
    "duration": number,              // milliseconds
    "timestamp": "ISO timestamp",
    "fallbackUsed": boolean
  }
}
```

#### Error Responses

- `400 Bad Request` - Missing blueprintId or incomplete answers
- `404 Not Found` - Blueprint not found
- `500 Internal Server Error` - Generation failed

---

### Get Blueprint Status

**GET** `/api/blueprints/:id/status`

Checks the status of blueprint generation.

#### URL Parameters

- `id` (uuid, required) - Blueprint ID

#### Response (200 OK)

```typescript
{
  "status": "generating|completed|error",
  "progress": number,                // 0-100
  "message": "string",               // Status message
  "completedAt": "ISO timestamp"     // If completed
}
```

---

### Get Blueprint

**GET** `/api/blueprint/:id`

Retrieves the generated blueprint content.

#### URL Parameters

- `id` (uuid, required) - Blueprint ID

#### Response (200 OK)

```typescript
{
  "blueprint": {
    "metadata": {
      "title": "string",
      "organization": "string",
      "generated_at": "ISO timestamp"
    },
    "executive_summary": {...},
    "learning_objectives": {...},
    "target_audience": {...},
    "instructional_strategy": {...},
    "content_outline": {...},
    "resources": {...},
    "assessment_strategy": {...},
    "implementation_timeline": {...},
    // ... other sections
  },
  "markdown": "string"               // Markdown version
}
```

---

## Logging API

### Get Logs (Admin)

**GET** `/api/logs`

Retrieves system logs with filtering and export options. Requires admin authentication.

#### Query Parameters

- `level` (string) - Filter by log level (debug, info, warn, error), comma-separated
- `service` (string) - Filter by service (api, database, claude, etc.), comma-separated
- `event` (string) - Filter by event type, comma-separated
- `userId` (string) - Filter by user ID
- `blueprintId` (string) - Filter by blueprint ID
- `from` (ISO timestamp) - Start date
- `to` (ISO timestamp) - End date
- `search` (string) - Search in messages and metadata
- `limit` (number) - Results per page (default: 100, max: 1000)
- `offset` (number) - Pagination offset
- `format` (string) - Export format: `json`, `csv`, `txt`

#### Response (200 OK) - JSON format

```typescript
{
  "logs": [
    {
      "id": "string",
      "timestamp": "ISO timestamp",
      "level": "debug|info|warn|error",
      "service": "string",
      "event": "string",
      "message": "string",
      "metadata": {}
    }
  ],
  "stats": {
    "total": number,
    "byLevel": {
      "debug": number,
      "info": number,
      "warn": number,
      "error": number
    },
    "byService": {},
    "errorRate": number,
    "avgDuration": number
  },
  "filters": {},
  "pagination": {
    "limit": number,
    "offset": number
  }
}
```

#### Response - CSV format

Returns CSV file with headers: ID, Timestamp, Level, Service, Event, Message, Duration, User ID, Blueprint ID, Error

#### Response - TXT format

Returns plain text with format:

```
[timestamp] [LEVEL] [service] event: message (duration)
```

---

### Clear Logs (Admin)

**DELETE** `/api/logs`

Clears all logs. Requires admin authentication.

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "All logs cleared successfully"
}
```

---

### Log Client Errors

**POST** `/api/logs/client`

Logs client-side errors to the server. Open to both authenticated and unauthenticated users.

#### Request Body

```typescript
{
  "level": "debug|info|warn|error",  // Required
  "event": "string",                  // Required
  "message": "string",                // Required
  "metadata": {                       // Optional
    "error": "string",
    "errorStack": "string",
    "errorCode": "string",
    "url": "string",
    "userAgent": "string",
    "componentStack": "string"
  }
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "message": "Log entry recorded"
}
```

#### Error Responses

- `400 Bad Request` - Missing required fields (event or message)

---

## Health Check

### Check API Health

**GET** `/api/health`

Simple health check endpoint for monitoring and offline detection.

#### Response (200 OK)

```typescript
{
  "status": "ok",
  "timestamp": "ISO timestamp"
}
```

**HEAD** `/api/health` - Also supported for lightweight checks

---

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```typescript
{
  "error": "string",              // Error message
  "details": {}                   // Optional error details
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, there are no rate limits enforced. For production deployment, consider implementing rate limiting using middleware.

---

## CORS Policy

CORS is configured to allow requests from the same origin. For external API access, update the Next.js configuration.

---

## Data Validation

All endpoints use Zod schemas for request validation. Validation errors return detailed error messages with field-specific issues:

```typescript
{
  "error": "Invalid request",
  "details": {
    "fieldErrors": {
      "fieldName": ["error message 1", "error message 2"]
    },
    "formErrors": ["general error"]
  }
}
```

---

## PII Handling

The logging system automatically redacts PII from all logs:

- API keys
- Tokens
- Passwords
- Authorization headers
- Session data

Never include sensitive user data in API requests where possible.

---

## Webhooks

The system supports comprehensive webhook integration with Razorpay for payment processing. See the **Razorpay Webhooks** section above for detailed documentation.

---

## SDK / Client Library

Use the built-in fetch API or axios. Example client usage:

```typescript
// Authenticated request
async function submitAnswers(blueprintId: string, answers: Record<string, any>) {
  const response = await fetch('/api/dynamic-answers/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blueprintId, answers }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
```

---

## Support

For API issues or questions, refer to:

- This documentation
- `/frontend/tests/api/` for integration test examples
- `/frontend/app/api/` for endpoint source code

---

_Last Updated: 2025-10-29_
_API Version: 1.2_
