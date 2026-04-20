# Frontend Code Structure Guide

## Overview

This document describes the standardized frontend code structure following modern Next.js 15, React 19, and best practices.

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups for auth
│   ├── (dashboard)/              # Route groups for dashboard
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin management endpoints
│   │   ├── webhooks/             # Webhook handlers
│   │   ├── account/             # User account management
│   │   └── [...]
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # All React components
│   ├── ui/                       # Primitive UI components (shadcn/ui)
│   ├── admin/                    # Admin dashboard components
│   ├── blueprint/               # Blueprint generation components
│   ├── dashboard/               # Dashboard components
│   ├── demo-dynamicv2/          # Dynamic questionnaire renderer
│   ├── layout/                   # Layout components
│   ├── pricing/                 # Pricing page components
│   ├── providers/                # React context providers
│   ├── theme/                    # Theme components
│   ├── usage/                    # Usage tracking components
│   └── [...]
├── lib/                          # Business logic and utilities
│   ├── services/                 # Business logic services
│   │   ├── blueprintGenerationService.ts
│   │   ├── dynamicQuestionGenerationV2.ts
│   │   ├── blueprintUsageService.ts
│   │   ├── claudeQuestionService.ts
│   │   └── [...]
│   ├── claude/                    # Claude AI client
│   │   ├── client.ts              # HTTP client
│   │   ├── config.ts              # Configuration
│   │   ├── prompts.ts             # Prompt templates
│   │   ├── validation.ts          # Response validation
│   │   └── fallback.ts            # Fallback logic
│   ├── config/                   # Configuration files
│   │   ├── razorpayConfig.ts
│   │   ├── razorpayPlans.ts
│   │   └── [...]
│   ├── auth/                      # Authentication utilities
│   │   ├── serverClient.ts        # Server-side auth
│   │   ├── clientClient.ts        # Client-side auth
│   │   └── [...]
│   ├── hooks/                     # Custom React hooks
│   │   ├── useBlueprintLimits.ts
│   │   ├── useRazorpayCheckout.ts
│   │   └── [...]
│   ├── stores/                    # State management (Zustand)
│   │   ├── blueprintStore.ts      # Main blueprint state
│   │   ├── authStore.ts         # Authentication state
│   │   ├── uiStore.ts           # UI state
│   │   └── [...]
│   ├── schemas/                   # Zod validation schemas
│   │   ├── blueprintSchema.ts
│   │   ├── paymentVerification.ts
│   │   ├── razorpaySubscription.ts
│   │   └── [...]
│   ├── utils/                     # General utilities
│   │   ├── tierDisplay.ts
│   │   ├── usageErrorHandler.ts
│   │   ├── environmentValidation.ts
│   │   └── [...]
│   ├── logging/                   # Structured logging
│   │   ├── webhookLogging.ts
│   │   ├── paymentVerification.ts
│   │   └── [...]
│   ├── middleware/                # Next.js middleware
│   │   ├── rateLimiting.ts
│   │   ├── usageTracking.ts
│   │   └── [...]
│   └── razorpay/                  # Razorpay integration
│       ├── handlers/            # Event handlers
│       ├── webhookSecurity.ts   # Webhook validation
│       └── [...]
├── types/                        # TypeScript type definitions
│   ├── razorpay.d.ts               # Razorpay types (572 lines)
│   ├── blueprint.ts               # Blueprint types
│   └── [...]
├── public/                       # Static assets
├── tests/                        # Test files
│   ├── api/                       # API endpoint tests
│   ├── integration/               # Integration tests
│   ├── services/                 # Service tests
│   ├── unit/                     # Unit tests
│   └── fixtures/                  # Test data
└── styles/                       # Global styles
    └── globals.css
```

## Component Organization

### UI Components (`components/ui/`)

Primitive, reusable UI components based on shadcn/ui patterns:

- `button.tsx` - Button component
- `input.tsx` - Input field
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialogs
- `dropdown.tsx` - Dropdown menus
- `toast.tsx` - Toast notifications

### Feature Components

Domain-specific components organized by feature:

- **admin/** - Admin dashboard and management
- **blueprint/** - Learning blueprint generation and management
- **dashboard/** - Main dashboard and analytics
- **demo-dynamicv2/** - Dynamic questionnaire renderer
- **pricing/** - Pricing page and subscription components
- **providers/** - React context providers
- **theme/** - Theme switching and styling
- **usage/** - Usage tracking components

### Layout Components (`components/layout/`)

Page layout components:

- `MainLayout.tsx` - Primary application layout
- `AuthLayout.tsx` - Authentication pages layout
- `DashboardLayout.tsx` - Dashboard layout

## Library Organization

### Services (`lib/services/`)

Business logic services for core functionality:

- **Blueprint Generation** - AI-powered blueprint creation
- **Dynamic Questions** - AI question generation
- **Usage Tracking** - Subscription and usage limits
- **Claude Integration** - AI model communication

### AI Integration (`lib/claude/`)

Claude AI client and configuration:

- **Client** - HTTP client with retry logic
- **Configuration** - Model settings and API keys
- **Prompts** - Prompt templates for different use cases
- **Validation** - Response schema validation
- **Fallback** - Model failure handling

### Payment Integration (`lib/razorpay/`)

Razorpay payment gateway integration:

- **Handlers** - Payment and subscription event handlers
- **Security** - Webhook signature validation
- **Configuration** - Razorpay settings and plans

### Authentication (`lib/auth/`)

Authentication utilities and session management:

- **Server Client** - Server-side Supabase auth
- **Client Client** - Client-side auth helpers
- **Middleware** - Auth middleware for protected routes

### State Management (`lib/stores/`)

Zustand state management stores:

- **Blueprint Store** - Main blueprint state container
- **Auth Store** - Authentication state management
- **UI Store** - UI component state
- **Optimistic Updates** - Client-side state synchronization

### Type Definitions (`types/`)

TypeScript type definitions:

- **Razorpay Types** - Comprehensive payment types (572 lines)
- **Blueprint Types** - Blueprint structure definitions
- **API Types** - Request/response type definitions

## Database Integration

### Supabase Client Configuration

- **Server Client** - Server-side database operations
- **Client Client** - Client-side real-time subscriptions
- **RLS Policies** - Row-level security enforcement
- **Migrations** - Database schema management

### Database Tables

- **blueprint_generator** - Core questionnaire and blueprint data
- **user_profiles** - User accounts and subscription management
- **razorpay_subscriptions** - Payment subscription records
- **razorpay_payments** - Payment transaction records
- **razorpay_webhook_events** - Webhook event logging

## API Route Structure

### Core Application APIs

- `POST /api/questionnaire/save` - Save static questionnaire
- `POST /api/generate-dynamic-questions` - AI question generation
- `POST /api/blueprints/generate` - AI blueprint generation
- `GET /api/user/usage` - Usage statistics

### Admin Management APIs

- `GET /api/admin/users` - User management
- `POST /api/admin/grant-access` - Admin access grants
- `GET /api/admin/metrics` - System metrics

### User Account APIs

- `POST /api/account/password/change` - Password changes
- `POST /api/account/delete` - Account deletion
- `GET /api/account/sessions` - Session management

### Payment Processing APIs

- `POST /api/webhooks/razorpay` - Razorpay webhook handler
- `/api/subscriptions/*` - Subscription management
- `/api/payments/*` - Payment processing

## Testing Structure

### Test Organization

- **Unit Tests** - Individual component and function tests
- **Integration Tests** - Feature interaction tests
- **API Tests** - Endpoint testing
- **Fixtures** - Test data and utilities

### Key Test Suites

- Claude AI client tests
- Blueprint generation service tests
- Dynamic questionnaire tests
- Admin dashboard tests
- Razorpay integration tests

## Configuration

### Environment Variables

- **Supabase** - Database connection and auth
- **Claude AI** - API keys and model configuration
- **Razorpay** - Payment gateway configuration
- **Application** - URLs and feature flags

### Build Configuration

- **Next.js Config** - Framework configuration
- **TypeScript Config** - Strict type checking
- **ESLint Config** - Code quality enforcement
- **Vitest Config** - Testing framework setup

## Development Patterns

### Component Patterns

- **Server Components by Default** - Use "use client" only when necessary
- **Composition over Inheritance** - Favor component composition
- **Props Interfaces** - TypeScript interfaces for all props
- **Error Boundaries** - Graceful error handling

### State Management

- **Zustand** - Lightweight state management
- **Optimistic Updates** - Instant UI feedback
- **Server State** - TanStack Query for server data
- **Persistence** - LocalStorage for critical state

### API Integration

- **Route Structure** - RESTful API design
- **Error Handling** - Structured error responses
- **Validation** - Zod schema validation
- **Logging** - Comprehensive request logging

## Security Considerations

### Authentication

- **RLS Policies** - Database-level security
- **Middleware** - Route protection
- **Session Management** - Secure token handling
- **API Key Protection** - Server-side only access

### Data Protection

- **PII Redaction** - Automatic sensitive data masking
- **Input Validation** - Comprehensive input sanitization
- **Rate Limiting** - Abuse prevention
- **Webhook Security** - Signature verification

## Performance Optimizations

### Client-Side

- **Code Splitting** - Dynamic imports for large components
- **Image Optimization** - Next.js Image component usage
- **Bundle Analysis** - Bundle size monitoring
- **Caching Strategy** - Appropriate caching patterns

### Server-Side

- **Database Optimization** - Query optimization
- **Connection Pooling** - Efficient resource usage
- **API Response Caching** - Strategic response caching
- **Background Jobs** - Non-blocking operations