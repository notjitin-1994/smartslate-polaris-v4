# API Documentation & Reference

> **Complete API Reference for SmartSlate Polaris v3**
> RESTful Design | Type-Safe | Comprehensive Examples

---

## 🚀 API Overview

The SmartSlate Polaris v3 API provides a **RESTful interface** for all platform functionality, including user management, questionnaire processing, AI-powered blueprint generation, and payment processing. All endpoints require authentication and follow consistent patterns.

**Base URL**: `https://your-domain.com/api`
**Authentication**: Bearer Token (Supabase JWT)
**Content-Type**: `application/json`
**Rate Limiting**: Implemented per user tier

---

## 🔐 Authentication

### **Authentication Method**
All API endpoints require authentication via Supabase JWT tokens:

```http
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### **Getting Auth Tokens**
```typescript
// Client-side authentication
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session?.access_token;
```

### **Authentication Headers**
```typescript
// Required headers for all requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Client-Version': '3.0.0'
};
```

---

## 📋 Core Endpoints

### **Questionnaire Management**

#### `POST /api/questionnaire/save`
Save static questionnaire answers (Phase 1).

**Request Body**:
```json
{
  "blueprintId": "optional-existing-uuid",
  "staticAnswers": {
    "section_1_role_experience": {
      "current_role": "Learning & Development Manager",
      "experience_years": "5-10",
      "team_size": "11-50",
      "industry": "technology"
    },
    "section_2_organization": {
      "company_name": "Tech Corp",
      "company_size": "1000-5000",
      "learning_budget": "$50,000-$100,000",
      "compliance_requirements": ["SOX", "GDPR"]
    },
    "section_3_learning_gap": {
      "primary_challenge": "skill gaps in new technologies",
      "target_audience": "software engineers",
      "learning_objectives": ["upskill in cloud computing", "improve security awareness"]
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000",
  "created": true,
  "status": "static_completed",
  "message": "Static questionnaire saved successfully"
}
```

#### `POST /api/generate-dynamic-questions`
Generate AI-powered dynamic questions based on static answers.

**Request Body**:
```json
{
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "success": true,
  "dynamicQuestions": [
    {
      "id": "section_1",
      "title": "Technical Skill Assessment",
      "description": "Evaluate current technical competencies",
      "questions": [
        {
          "id": "q1",
          "type": "scale",
          "question": "Rate your team's proficiency in cloud computing",
          "required": true,
          "scale": {
            "min": 1,
            "max": 5,
            "labels": {
              "1": "Beginner",
              "5": "Expert"
            }
          }
        }
      ]
    }
  ],
  "metadata": {
    "totalSections": 10,
    "totalQuestions": 67,
    "estimatedTime": "25-30 minutes",
    "model": "claude-sonnet-4.5",
    "generationTime": 2.3
  }
}
```

#### `POST /api/dynamic-questionnaire/save`
Save dynamic questionnaire answers (Phase 2).

**Request Body**:
```json
{
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000",
  "dynamicAnswers": {
    "section_1": {
      "q1": 4,
      "q2": "hybrid approach",
      "q3": ["aws", "azure"]
    },
    "section_2": {
      "q1": "quarterly",
      "q2": "high priority",
      "q3": 1000000
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "dynamic_completed",
  "progress": 100,
  "message": "Dynamic questionnaire saved successfully"
}
```

### **Blueprint Generation**

#### `POST /api/blueprints/generate`
Generate final learning blueprint from questionnaire answers.

**Request Body**:
```json
{
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response** (immediate):
```json
{
  "success": true,
  "blueprintId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "generating",
  "estimatedTime": 15,
  "message": "Blueprint generation started"
}
```

**Streaming Updates** (if streaming enabled):
```typescript
// Server-Sent Events for real-time updates
const eventSource = new EventSource('/api/blueprints/generate/123e4567-e89b-12d3-a456-426614174000/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'progress':
      console.log(`Progress: ${data.progress}%`);
      break;
    case 'section_complete':
      console.log(`Section completed: ${data.section}`);
      break;
    case 'complete':
      console.log('Blueprint generation complete');
      break;
    case 'error':
      console.error('Generation failed:', data.error);
      break;
  }
};
```

#### `GET /api/blueprints/[id]`
Retrieve a completed blueprint.

**Response**:
```json
{
  "success": true,
  "blueprint": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Cloud Computing Upskilling Program",
    "status": "completed",
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:15:00Z",
    "content": {
      "executive_summary": {
        "roi_projection": "$250,000 annual savings",
        "timeline": "6 months",
        "participant_count": 50
      },
      "learning_objectives": [
        {
          "id": 1,
          "objective": "Master AWS core services",
          "bloom_level": "Application",
          "measurement": "AWS certification achievement"
        }
      ],
      "implementation_plan": {
        "phase_1": {
          "duration": "2 months",
          "activities": ["AWS fundamentals training"],
          "deliverables": ["15 certified engineers"]
        }
      }
    },
    "metadata": {
      "generationModel": "claude-sonnet-4.5",
      "generationTime": 12.5,
      "tokenCount": 15420,
      "fallbackUsed": false
    }
  }
}
```

### **Export Functionality**

#### `GET /api/blueprints/[id]/export`
Export blueprint in different formats.

**Query Parameters**:
- `format`: `pdf` | `docx` | `markdown` (default: `pdf`)
- `includeMetadata`: `true` | `false` (default: `false`)

**Request**:
```http
GET /api/blueprints/123e4567-e89b-12d3-a456-426614174000/export?format=pdf&includeMetadata=true
```

**Response**:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="cloud-computing-upskilling.pdf"
Content-Length: 2048576

[PDF binary data]
```

---

## 👤 User Management

### **User Profile**

#### `GET /api/user/profile`
Get current user's profile and subscription information.

**Response**:
```json
{
  "success": true,
  "profile": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "subscriptionTier": "navigator",
    "userRole": "learning_manager",
    "avatar": "https://avatar-url",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "usage": {
    "blueprintCreationCount": 15,
    "blueprintSavingCount": 8,
    "blueprintCreationLimit": 20,
    "blueprintSavingLimit": 20,
    "creationRemaining": 5,
    "savingRemaining": 12,
    "resetDate": "2025-02-01T00:00:00Z"
  },
  "subscription": {
    "tier": "navigator",
    "status": "active",
    "price": 39,
    "billingCycle": "monthly",
    "features": [
      "20 blueprint creations per month",
      "Word export",
      "Priority processing",
      "Email support"
    ]
  }
}
```

#### `PUT /api/user/profile`
Update user profile information.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://new-avatar-url",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": true,
      "browser": false
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### **Usage Statistics**

#### `GET /api/user/usage`
Get detailed usage statistics and history.

**Response**:
```json
{
  "success": true,
  "usage": {
    "currentMonth": {
      "blueprintsCreated": 3,
      "blueprintsSaved": 2,
      "aiTokensUsed": 45620,
      "estimatedCost": 12.34
    },
    "lastMonth": {
      "blueprintsCreated": 5,
      "blueprintsSaved": 4,
      "aiTokensUsed": 78230,
      "estimatedCost": 23.45
    },
    "history": [
      {
        "date": "2025-01-07",
        "blueprintsCreated": 1,
        "tokensUsed": 15420,
        "cost": 4.56
      }
    ]
  },
  "limits": {
    "blueprintCreations": {
      "used": 3,
      "limit": 20,
      "remaining": 17
    },
    "blueprintSavings": {
      "used": 2,
      "limit": 20,
      "remaining": 18
    }
  }
}
```

---

## 💳 Payment Processing

### **Subscription Management**

#### `POST /api/payments/create`
Create a new subscription or upgrade existing one.

**Request Body**:
```json
{
  "tier": "voyager",
  "billingCycle": "monthly",
  "paymentMethodId": "pm_razorpay_payment_id"
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_razorpay_subscription_id",
    "tier": "voyager",
    "status": "active",
    "currentPeriodStart": "2025-01-07T10:00:00Z",
    "currentPeriodEnd": "2025-02-07T10:00:00Z",
    "amount": 7900,
    "currency": "USD"
  },
  "razorpayOrder": {
    "id": "order_razorpay_order_id",
    "amount": 7900,
    "currency": "USD"
  }
}
```

#### `POST /api/payments/cancel`
Cancel user subscription.

**Request Body**:
```json
{
  "reason": "no_longer_needed",
  "feedback": "Found alternative solution"
}
```

**Response**:
```json
{
  "success": true,
  "cancelledAt": "2025-01-07T10:00:00Z",
  "endDate": "2025-02-07T10:00:00Z",
  "message": "Subscription cancelled successfully"
}
```

### **Payment History**

#### `GET /api/payments/history`
Get user's payment history.

**Response**:
```json
{
  "success": true,
  "payments": [
    {
      "id": "pay_razorpay_payment_id",
      "date": "2025-01-01T00:00:00Z",
      "amount": 3900,
      "currency": "USD",
      "status": "captured",
      "tier": "navigator",
      "billingCycle": "monthly"
    }
  ],
  "summary": {
    "totalSpent": 7800,
    "averageMonthlySpend": 3900
  }
}
```

---

## 🔒 Administrative Endpoints

*Note: These endpoints require administrative privileges.*

### `GET /api/admin/users`
List all users with pagination.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `tier`: Filter by subscription tier
- `status`: Filter by status

### `GET /api/admin/analytics`
Get platform-wide analytics.

**Response**:
```json
{
  "success": true,
  "analytics": {
    "users": {
      "total": 1250,
      "active": 980,
      "newThisMonth": 145
    },
    "blueprints": {
      "total": 5420,
      "thisMonth": 890,
      "averageGenerationTime": 12.5
    },
    "revenue": {
      "mrr": 45600,
      "arr": 547200,
      "growthRate": 0.15
    }
  }
}
```

---

## 🚨 Error Handling

### **Error Response Format**
All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "staticAnswers",
      "issue": "Required field missing"
    },
    "timestamp": "2025-01-07T10:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `AI_SERVICE_ERROR` | 502 | AI provider service unavailable |
| `DATABASE_ERROR` | 503 | Database connection issue |
| `PAYMENT_ERROR` | 402 | Payment processing failed |

### **Rate Limiting**
Rate limits are enforced per user based on subscription tier:

```json
{
  "rateLimit": {
    "requests": 1000,
    "window": "1h",
    "tier": "navigator"
  },
  "remaining": 945,
  "resetAt": "2025-01-07T11:00:00Z"
}
```

---

## 🔄 Response Headers

### **Standard Headers**
All responses include these headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 945
X-RateLimit-Reset: 1704626400
X-Response-Time: 245
X-Request-ID: req_123456789
Cache-Control: public, max-age=300
```

### **CORS Headers**
```http
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type, X-Client-Version
Access-Control-Max-Age: 86400
```

---

## 🧪 Testing

### **Example cURL Commands**

```bash
# Save static questionnaire
curl -X POST https://your-domain.com/api/questionnaire/save \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staticAnswers": {
      "section_1_role_experience": {
        "current_role": "Learning Manager",
        "experience_years": "5-10"
      }
    }
  }'

# Generate blueprint
curl -X POST https://your-domain.com/api/blueprints/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blueprintId": "your-blueprint-id"}'

# Export blueprint as PDF
curl -X GET "https://your-domain.com/api/blueprints/your-blueprint-id/export?format=pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "blueprint.pdf"
```

### **JavaScript/TypeScript Examples**

```typescript
// API client setup
class PolarisAPI {
  private baseURL = 'https://your-domain.com/api';
  private authToken: string;

  constructor(token: string) {
    this.authToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async saveQuestionnaire(blueprintId: string, staticAnswers: any) {
    return this.request('/questionnaire/save', {
      method: 'POST',
      body: JSON.stringify({ blueprintId, staticAnswers })
    });
  }

  async generateBlueprint(blueprintId: string) {
    return this.request('/blueprints/generate', {
      method: 'POST',
      body: JSON.stringify({ blueprintId })
    });
  }
}

// Usage
const api = new PolarisAPI(userToken);
const result = await api.saveQuestionnaire('blueprint-id', staticAnswers);
```

---

## 📊 Monitoring & Debugging

### **Request ID Tracking**
Every request includes a unique `X-Request-ID` header for debugging:

```bash
# Log request ID for debugging
curl -v https://your-domain.com/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" 2>&1 | grep X-Request-ID
```

### **Health Check**
Monitor API health status:

```bash
curl https://your-domain.com/api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-07T10:00:00Z",
  "version": "3.0.0",
  "services": {
    "database": "healthy",
    "ai_providers": "healthy",
    "payment": "healthy"
  }
}
```

---

## 📝 SDK and Integration

### **React Hook Example**

```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseAPIOptions {
  autoRefresh?: boolean;
  retryCount?: number;
}

export function useAPI<T>(endpoint: string, options: UseAPIOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Usage
const { data: profile, loading, error } = useAPI('/user/profile');
```

---

**Document Status**: Production Ready | **Version**: 3.0.0
**Last Updated**: January 2025 | **Next Review**: After major API changes
**API Base URL**: https://your-domain.com/api

---

> **Note**: This API documentation is version-controlled. Always check the `X-API-Version` header for the current API version and review changelog for breaking changes.