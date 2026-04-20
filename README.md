# SmartSlate Polaris v3

> **AI-Powered Learning Blueprint Generation Platform**

Transform organizational learning needs into comprehensive, implementation-ready learning blueprints in minutes using advanced AI technology.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SmartSlate Polaris v3 is an enterprise-grade SaaS platform that revolutionizes learning and development by generating personalized, comprehensive learning blueprints through AI-powered intelligent questionnaires. The platform reduces blueprint creation time from months to minutes while maintaining professional quality and actionable insights.

### What It Does

1. **Captures Context**: Users complete a 3-section static questionnaire covering role, organization, and learning gaps
2. **Generates Dynamic Questions**: AI analyzes responses and creates 10 personalized sections with 50-70 contextual questions
3. **Creates Blueprints**: Generates comprehensive learning blueprints with executive summaries, objectives, strategies, timelines, and KPIs
4. **Enables Export**: Provides multiple export formats (PDF, Word, Markdown) and shareable links

### Target Users

- **Learning & Development Managers** - Strategic program design
- **Instructional Designers** - Detailed implementation guidance
- **HR Directors & CLOs** - Executive-ready presentations
- **Training Teams** - Collaborative blueprint development

---

## Key Features

### 🎯 Intelligent Questionnaire System

#### Static Questionnaire (Phase 1)
- **3-Section Assessment**: Role & Experience, Organization Context, Learning Gap Analysis
- **30+ Fields**: Comprehensive data capture including industry, team size, budget, compliance
- **Auto-Save**: Automatic progress preservation every 30 seconds
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

#### Dynamic Question Generation (Phase 2)
- **AI-Powered Personalization**: Context-aware questions based on Phase 1 responses
- **10 Sections, 50-70 Questions**: Comprehensive coverage of learning needs
- **27+ Input Types**: Radio pills, sliders, scales, toggles, multi-select, currency, and more
- **Section Navigation**: Progress tracking with resume capability
- **Offline Support**: Works without internet connection

### 🤖 AI-Powered Blueprint Generation

#### Dual-Fallback Architecture
```
Claude Sonnet 4.5 (Primary) → Claude Sonnet 4 (Secondary)
```

- **Primary**: Claude Sonnet 4.5 - Cost-effective, high-quality generation
- **Secondary**: Claude Sonnet 4 - Fallback for reliability and capacity management

#### Comprehensive Blueprint Output
- Executive Summary with ROI projections
- SMART Learning Objectives (Bloom's Taxonomy aligned)
- Target Audience Analysis & Segmentation
- Instructional Strategy with modality recommendations
- Detailed Content Outline with module structure
- Resource Requirements (budget, timeline, tools)
- Assessment Strategy with KPIs
- Implementation Timeline with critical path
- Risk Mitigation Plans
- Success Metrics Dashboard
- Long-term Sustainability Plan

### 📊 Flexible Display System

**Multiple View Modes**:
- **Infographic View**: Data-driven visual dashboards
- **Markdown View**: Narrative formatted content
- **Timeline View**: Sequential information display
- **Chart View**: Quantitative data visualization (bar/line/pie/radar)
- **Table View**: Structured comparative data

### 📦 Export & Sharing

- **PDF Export**: Professional formatted documents
- **Word Export**: Editable .docx with styling
- **Markdown Export**: Plain text with formatting
- **Share Links**: Collaborative blueprint viewing
- **Version History**: Track changes and iterations (paid tiers)

### 💎 Subscription System

#### Free Tier (Explorer)
- 2 blueprint creations per month
- 2 blueprint saves per month
- PDF export only
- Community support
- Full feature access

#### Paid Tiers (Planned)
- **Navigator** ($39/month): 20 creations, Word export, priority processing
- **Voyager** ($79/month): 40 creations, API access, dedicated manager
- **Team Plans**: Crew, Fleet, Armada (collaborative features)
- **Enterprise**: Custom pricing, unlimited everything

---

## Technology Stack

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15.5.3 | React framework with App Router |
| **Language** | TypeScript | 5.7 | Type-safe development |
| **Styling** | Tailwind CSS | 4.1.13 | Utility-first CSS |
| **UI Components** | Radix UI | Latest | Accessible primitives |
| **State Management** | Zustand | 4.5.7 | Lightweight state management |
| **Forms** | React Hook Form | 7.63 | Form handling & validation |
| **Validation** | Zod | 3.25.76 | Schema validation |
| **Animation** | Framer Motion | 12.23 | Smooth animations |
| **Charts** | Recharts | 3.2.1 | Data visualization |

### Backend & Infrastructure

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Database** | PostgreSQL 15+ | Primary data store via Supabase |
| **Authentication** | Supabase Auth | Email/OAuth (Google, GitHub) |
| **Realtime** | Supabase Subscriptions | Live data updates |
| **Storage** | Supabase Storage | File storage |
| **Hosting** | Vercel | Serverless deployment |
| **CDN** | Vercel Edge Network | Global content delivery |

### AI & LLM Integration

| Provider | Model | Purpose | Max Tokens |
|----------|-------|---------|------------|
| **Anthropic** | Claude Sonnet 4.5 | Primary generation | 12,000 |
| **Anthropic** | Claude Sonnet 4 | Fallback generation | 16,000 |

**Integration Framework**:
- Custom HTTP clients with retry logic
- Zod schema validation
- Streaming support for real-time updates
- Token usage tracking
- Error handling with automatic fallback

### Development Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit & integration testing |
| **React Testing Library** | Component testing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit checks |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (App Router)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Static     │→ │   Dynamic    │→ │  Blueprint   │      │
│  │ Questionnaire│  │ Questionnaire│  │  Generation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Next.js Routes)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Questionnaire│  │   Dynamic    │  │  Blueprint   │      │
│  │     APIs     │  │ Question Gen │  │     APIs     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL + Row Level Security        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ blueprint_generator│  │  user_profiles  │                │
│  │  (main data)      │  │  (usage limits) │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 AI Providers (Dual Fallback)                 │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │Claude Sonnet │→ │ Claude Sonnet │                         │
│  │   4.5        │  │      4       │                         │
│  │  (Primary)   │  │ (Fallback)   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication** → Supabase Auth creates user session
2. **Static Questionnaire** → Saves to [`blueprint_generator.static_answers`](supabase/migrations/0003_blueprint_generator.sql:8)
3. **Dynamic Question Generation** → AI analyzes context, saves to [`blueprint_generator.dynamic_questions`](supabase/migrations/0003_blueprint_generator.sql:9)
4. **Dynamic Questionnaire** → User completes, saves to [`blueprint_generator.dynamic_answers`](supabase/migrations/0003_blueprint_generator.sql:10)
5. **Blueprint Generation** → AI creates blueprint, saves to [`blueprint_generator.blueprint_json`](supabase/migrations/0003_blueprint_generator.sql:11) & [`blueprint_markdown`](supabase/migrations/0003_blueprint_generator.sql:12)
6. **Export/Share** → Generate PDF/Word or create shareable link

### Database Schema

#### `blueprint_generator` (Core Table)
```sql
CREATE TABLE blueprint_generator (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft','generating','answering','completed','error')),
  title TEXT,
  static_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  dynamic_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  dynamic_questions_raw JSONB,
  dynamic_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  blueprint_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  blueprint_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `user_profiles` (Usage & Subscriptions)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  user_role TEXT NOT NULL DEFAULT 'explorer',
  subscription_metadata JSONB DEFAULT '{}'::jsonb,
  blueprint_creation_count INTEGER NOT NULL DEFAULT 0,
  blueprint_saving_count INTEGER NOT NULL DEFAULT 0,
  blueprint_creation_limit INTEGER NOT NULL DEFAULT 2,
  blueprint_saving_limit INTEGER NOT NULL DEFAULT 2,
  usage_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0
- **PostgreSQL** (via Supabase account)
- **Anthropic API Key** (for Claude AI)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/polaris-v3.git
cd polaris-v3

# Install root dependencies
npm install

# Navigate to frontend and install dependencies
cd frontend
npm install
```

### Environment Configuration

Create [`frontend/.env.local`](.env.example:1) with the following variables:

```env
# ========================================
# Supabase Configuration (Required)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ========================================
# AI Providers (Required)
# ========================================
# Primary: Claude for blueprint generation
ANTHROPIC_API_KEY=sk-ant-your-key

# ========================================
# Application Configuration
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Get Your API Keys**:
- **Supabase**: [Create project](https://app.supabase.com) → Settings → API
- **Anthropic**: [Get API key](https://console.anthropic.com/settings/keys)

### Database Setup

```bash
# Using Supabase CLI (local development)
npx supabase start

# Apply migrations
npx supabase migration up

# OR deploy to remote Supabase
npx supabase db push
```

### Running the Application

```bash
# Development server (from frontend directory)
cd frontend
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

### First-Time Setup

1. **Create Account**: Sign up at `/auth/signup`
2. **Complete Profile**: Add your name and organization
3. **Start Questionnaire**: Click "Create New Starmap"
4. **Generate Blueprint**: Complete both questionnaire phases
5. **View & Export**: Access your blueprint from dashboard

---

## Project Structure

```
polaris-v3/
├── frontend/                          # Next.js application
│   ├── app/                           # App Router
│   │   ├── (auth)/                    # Protected routes
│   │   │   ├── static-wizard/         # Phase 1 questionnaire
│   │   │   ├── dynamic-questionnaire/ # Phase 2 questionnaire
│   │   │   ├── blueprint/[id]/        # Blueprint viewer
│   │   │   ├── my-starmaps/           # User's blueprints
│   │   │   ├── profile/               # User profile
│   │   │   └── settings/              # User settings
│   │   ├── api/                       # API routes
│   │   │   ├── questionnaire/         # Questionnaire endpoints
│   │   │   ├── generate-dynamic-questions/ # AI question generation
│   │   │   ├── blueprints/            # Blueprint operations
│   │   │   └── user/                  # User management
│   │   ├── auth/                      # Auth pages (login/signup)
│   │   ├── pricing/                   # Pricing page
│   │   └── page.tsx                   # Dashboard
│   ├── components/                    # React components
│   │   ├── wizard/                    # Static questionnaire UI
│   │   ├── demo-v2-questionnaire/     # Dynamic form renderer
│   │   ├── blueprint/                 # Blueprint display
│   │   ├── dashboard/                 # Dashboard components
│   │   ├── layout/                    # Layout components
│   │   ├── profile/                   # Profile components
│   │   ├── settings/                  # Settings components
│   │   ├── theme/                     # Theme provider
│   │   ├── ui/                        # Base UI components
│   │   └── usage/                     # Usage tracking UI
│   ├── lib/                           # Business logic
│   │   ├── services/                  # Core services
│   │   │   ├── blueprintGenerationService.ts
│   │   │   ├── dynamicQuestionGenerationV2.ts
│   │   │   └── blueprintUsageService.ts
│   │   ├── claude/                    # Claude AI client
│   │   │   ├── client.ts              # HTTP client
│   │   │   ├── config.ts              # Configuration
│   │   │   ├── prompts.ts             # Prompt templates
│   │   │   ├── validation.ts          # Response validation
│   │   │   └── fallback.ts            # Fallback logic
│   │   ├── auth/                      # Auth utilities
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── logging/                   # Structured logging
│   │   ├── supabase/                  # Supabase clients
│   │   └── utils/                     # Utility functions
│   ├── contexts/                      # React contexts
│   │   └── AuthContext.tsx            # Authentication context
│   ├── types/                         # TypeScript definitions
│   ├── tests/                         # Test files
│   │   ├── api/                       # API tests
│   │   ├── integration/               # Integration tests
│   │   ├── claude/                    # Claude client tests
│   │   └── fixtures/                  # Test data
│   ├── public/                        # Static assets
│   └── styles/                        # Global styles
├── supabase/                          # Database
│   ├── migrations/                    # SQL migrations
│   └── config.toml                    # Supabase config
├── scripts/                           # Utility scripts
│   ├── migrate-blueprints-v1-to-v2.ts
│   └── dependency-scanner.ts
├── docs/                              # Documentation
│   ├── guides/                        # Setup guides
│   └── prds/                          # Product requirements
├── .github/                           # GitHub workflows
├── package.json                       # Root dependencies
└── README.md                          # This file
```

---

## Development

### Available Scripts

#### Root Directory
```bash
npm run supabase              # Supabase CLI
npm run db:reset              # Reset local database
npm run db:push               # Push migrations to remote
npm run db:migrations:new     # Create new migration
```

#### Frontend Directory
```bash
npm run dev                   # Development server (port 3000)
npm run build                 # Production build
npm run start                 # Production server
npm run lint                  # ESLint check
npm run format                # Prettier format
npm run typecheck             # TypeScript check
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:integration      # Integration tests
```

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/my-feature`
2. **Make Changes**: Write type-safe code with tests
3. **Run Linting**: `npm run lint`
4. **Run Tests**: `npm run test`
5. **Commit**: `git commit -m "feat: add feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Create PR**: Submit for review

### Commit Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Code Quality Standards

- **TypeScript Strict Mode**: No `any` types allowed
- **Test Coverage**: 90%+ for critical paths
- **ESLint + Prettier**: Enforced via pre-commit hooks
- **Accessibility**: WCAG AA compliance
- **Performance**: <2s page loads, <500KB bundles

---

## API Documentation

### Authentication

All API endpoints require authentication via Supabase Auth:

```typescript
// Headers required
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json
```

### Core Endpoints

#### `POST /api/questionnaire/save`
Save static questionnaire answers (Phase 1).

**Request**:
```json
{
  "blueprintId": "optional-existing-uuid",
  "staticAnswers": {
    "section_1_role_experience": { /* ... */ },
    "section_2_organization": { /* ... */ },
    "section_3_learning_gap": { /* ... */ }
  }
}
```

**Response**:
```json
{
  "success": true,
  "blueprintId": "uuid",
  "created": true
}
```

#### `POST /api/generate-dynamic-questions`
Generate AI-powered dynamic questions based on static answers.

**Request**:
```json
{
  "blueprintId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "dynamicQuestions": [
    {
      "id": "section_1",
      "title": "Section Title",
      "questions": [ /* ... */ ]
    }
  ],
  "metadata": {
    "model": "claude-sonnet-4",
    "duration": 2500
  }
}
```

#### `POST /api/blueprints/generate`
Generate final blueprint from questionnaire answers.

**Request**:
```json
{
  "blueprintId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "blueprintId": "uuid",
  "metadata": {
    "model": "claude-sonnet-4",
    "duration": 8500,
    "fallbackUsed": false
  }
}
```

#### `GET /api/user/usage`
Get current user's usage statistics.

**Response**:
```json
{
  "success": true,
  "usage": {
    "creationCount": 1,
    "savingCount": 0,
    "creationLimit": 2,
    "savingLimit": 2,
    "creationRemaining": 1,
    "savingRemaining": 2,
    "subscriptionTier": "free"
  }
}
```

For complete API documentation, see [`frontend/API_DOCUMENTATION.md`](frontend/API_DOCUMENTATION.md).

---

## Testing

### Running Tests

```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- tests/api/logs.test.ts

# Watch mode
npm run test:watch

# Integration tests
npm run test:integration
```

### Test Structure

```
frontend/tests/
├── api/                       # API endpoint tests
├── integration/               # Integration tests
├── claude/                    # Claude client tests
├── fixtures/                  # Test data
└── README.md                  # Testing guide
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { generateDynamicQuestions } from '@/lib/services/dynamicQuestionGenerationV2';

describe('Dynamic Question Generation', () => {
  it('should generate valid questions', async () => {
    const result = await generateDynamicQuestions('blueprint-id', {
      section_1_role_experience: { /* ... */ }
    });
    
    expect(result.success).toBe(true);
    expect(result.sections).toHaveLength(10);
  });
});
```

---

## Deployment

### Vercel Deployment

The project is optimized for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project (first time)
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Environment Variables

Configure in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

### Production Checklist

- [ ] Environment variables configured
- [ ] Supabase migrations applied
- [ ] Anthropic API key valid and funded
- [ ] Domain configured and SSL enabled
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Database connection pooling enabled
- [ ] RLS policies tested

### Monitoring

- **Vercel Analytics**: Page performance, Web Vitals
- **Supabase Dashboard**: Database performance, API usage
- **Application Logs**: Structured logging to admin dashboard
- **Error Tracking**: Automatic error reporting
- **Usage Metrics**: Subscription tier usage tracking

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/polaris-v3.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install && cd frontend && npm install`
5. Set up environment variables (see [Getting Started](#getting-started))
6. Make your changes with tests
7. Run tests: `npm run test`
8. Lint your code: `npm run lint`
9. Commit: `git commit -m "feat: add amazing feature"`
10. Push: `git push origin feature/amazing-feature`
11. Create a Pull Request

### Code Standards

- **TypeScript**: Strict mode, explicit types, no `any`
- **Components**: Server Components by default, `"use client"` only when needed
- **Styling**: Tailwind utilities, semantic tokens, no hardcoded colors
- **Testing**: Unit tests for logic, integration tests for APIs
- **Accessibility**: WCAG AA compliance, keyboard navigation
- **Performance**: <2s page loads, optimize images, lazy loading

### Pull Request Process

1. Update README if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update API documentation if applicable
5. Request review from maintainers
6. Address review feedback
7. Squash commits before merge

---

## License

Copyright © 2025 SmartSlate. All rights reserved.

**Proprietary Software** - This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

For licensing inquiries, contact: licensing@smartslate.io

---

## Support & Contact

### Customer Support
- **Email**: support@smartslate.io
- **Response Time**: 24h for paid plans, 48h for free tier
- **Enterprise**: Dedicated success manager with 4h SLA

### Technical Support
- **Documentation**: This README and inline code documentation
- **Issues**: GitHub Issues (for bug reports)
- **Discussions**: GitHub Discussions (for questions)

---

## Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/) - React framework
- [Anthropic Claude](https://www.anthropic.com/) - AI intelligence
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Hosting platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible components

Special thanks to the open-source community for making this possible.

---

**Last Updated**: January 24, 2025  
**Version**: 3.0.0  
**Status**: Active Development
