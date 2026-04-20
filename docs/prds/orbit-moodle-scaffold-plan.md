# Orbit LMS: Comprehensive Implementation Plan

**Project**: Orbit LMS - AI-Powered Personalized Learning Delivery Platform
**Vision Source**: Solara Vision Document (Smartslate)
**Design System**: Smartslate Brand Design Guide
**Date**: October 29, 2025
**Status**: Technical Architecture & Implementation Blueprint

---

## Executive Summary

This document provides the comprehensive technical implementation plan for **Orbit LMS**, the personalized learning delivery component of the Solara ecosystem. Orbit represents a fundamental reimagining of the traditional Learning Management System, leveraging Moodle's proven backend architecture while implementing a complete frontend transformation that embodies the Solara vision of AI-native, unified learning infrastructure.

### Strategic Positioning within Solara Ecosystem

Orbit sits at the center of the Solara platform architecture:

```
Polaris (Blueprint Generation) → Constellation (Content Automation) → Nova (Content Authoring)
                                                                              ↓
                                                                        ORBIT LMS
                                                                              ↓
Nebula (AI Assistant) ← Spectrum (Analytics) ← Learner Data & Progress
```

### Core Value Proposition

**Traditional LMS Problem**: Fragmented experiences, siloed data, poor completion rates (3-6%), disconnected tool ecosystems requiring 10-15+ different systems.

**Orbit Solution**: Unified, AI-native learning delivery platform that achieves:
- 80%+ completion rates (vs 3-6% industry average)
- 40% faster time-to-competency through personalized learning paths
- Real-time AI tutoring and intelligent content adaptation
- Seamless integration with complete Solara ecosystem
- Enterprise-grade security and scalability from day one

### Key Implementation Principles

1. **AI-Native Architecture**: Every component designed for AI integration from the ground up
2. **Unified Experience**: Single sign-on, consistent UX, unified data model across all Solara products
3. **Enterprise-First**: SOC 2 Type II compliance, 99.9% uptime SLA, global scalability
4. **Outcome-Obsessed**: Every feature evaluated against learning outcome improvement
5. **Modern Frontend**: Complete UI/UX transformation following Smartslate design system
6. **Moodle Foundation**: Leverage proven backend while completely transforming the experience

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Solara Integration & Data Flow](#2-solara-integration--data-flow)
3. [Frontend Design System & Architecture](#3-frontend-design-system--architecture)
4. [Phase 1: Environment Setup & Analysis](#4-phase-1-environment-setup--analysis)
5. [Phase 2: Modern Frontend Implementation](#5-phase-2-modern-frontend-implementation)
6. [Phase 3: Component Library & UI System](#6-phase-3-component-library--ui-system)
7. [Phase 4: Learning Experience Redesign](#7-phase-4-learning-experience-redesign)
8. [Phase 5: AI Integration Layer](#8-phase-5-ai-integration-layer)
9. [Phase 6: Backend Customization](#9-phase-6-backend-customization)
10. [Phase 7: Analytics & Intelligence](#10-phase-7-analytics--intelligence)
11. [Phase 8: Testing & Quality Assurance](#11-phase-8-testing--quality-assurance)
12. [Phase 9: Performance & Optimization](#12-phase-9-performance--optimization)
13. [Phase 10: Deployment & DevOps](#13-phase-10-deployment--devops)
14. [Technical Implementation Details](#14-technical-implementation-details)
15. [Development Timeline & Milestones](#15-development-timeline--milestones)
16. [Resource Requirements & Team Structure](#16-resource-requirements--team-structure)
17. [Risk Management & Mitigation](#17-risk-management--mitigation)
18. [Success Metrics & KPIs](#18-success-metrics--kpis)

---

## 1. Architecture Overview

### 1.1 High-Level System Architecture

Orbit LMS implements a **Hybrid Headless Architecture** that preserves Moodle's robust backend while delivering a completely modern, AI-native frontend experience.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            ORBIT FRONTEND LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Next.js 15    │  │   React 18      │  │   TypeScript    │  │   TailwindCSS   │  │
│  │   App Router    │  │   Server Comp   │  │   Strict Mode   │  │   + Glassmorphism│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Zustand       │  │   TanStack      │  │   Framer Motion │  │   Smartslate    │  │
│  │   State Mgmt    │  │   Query         │  │   Animations    │  │   Design System │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↕️ Secure API Gateway
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        SOLARA INTEGRATION LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   API Gateway   │  │   Auth Layer    │  │   Message Queue │  │   Cache Layer   │  │
│  │   (Express/FastAPI)│ │   (JWT/SAML)    │  │   (Redis)       │  │   (Redis)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Polaris API   │  │  Nebula AI      │  │  Spectrum       │  │  Analytics      │  │
│  │  Integration    │  │  Assistant      │  │  Analytics      │  │  Processing     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↕️ Moodle Web Services
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          MOODLE BACKEND LAYER                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Moodle 4.4    │  │   Custom APIs   │  │   Plugin System │  │   Security      │  │
│  │   Core Engine   │  │   & Web Svc     │  │   & Hooks       │  │   & RLS         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Course Mgmt   │  │   User/Enroll   │  │   Assessment    │  │   Content Repo  │  │
│  │   & Progress    │  │   Management    │  │   & Grading     │  │   & Files       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↕️ Database Connections
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          DATA & STORAGE LAYER                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL    │  │   Redis Cache   │  │   Vector DB     │  │   File Storage  │  │
│  │   (Moodle +    │  │   (Session +    │  │   (Pinecone/    │  │   (S3 + Cloud   │  │
│  │    Analytics)  │  │    Query)       │  │    Weaviate)    │  │    CDN)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Rationale

#### Frontend Stack (Next.js 15 + React 18)
- **Next.js 15 App Router**: Enables Server Components, streaming, and optimal performance
- **React 18 Server Components**: Reduces client bundle size by 60-70%
- **TypeScript 5.7+**: Type safety, better IntelliSense, reduced runtime errors
- **TailwindCSS v4**: Rapid development with design system consistency
- **Zustand**: Lightweight state management (3KB vs Redux's 45KB)
- **TanStack Query**: Best-in-class server state management and caching
- **Framer Motion**: Smooth animations and micro-interactions

#### Backend & Integration Stack
- **Moodle 4.4**: Latest stable with enhanced API capabilities
- **PHP 8.2**: Performance improvements and modern syntax
- **PostgreSQL 15+**: Advanced JSONB support, better performance
- **Redis 7+**: Session management, caching, and real-time features
- **FastAPI/Python**: High-performance AI integration layer
- **Docker & Kubernetes**: Containerized deployment and orchestration

#### AI & Analytics Stack
- **Vector Database**: Pinecone/Weaviate for RAG implementation
- **OpenAI API**: GPT-4 and embedding models
- **Apache Kafka**: Real-time event streaming for analytics
- **Elasticsearch**: Advanced search and content indexing
- **MLflow**: Machine learning model management

### 1.3 Key Architectural Decisions

#### 1.3.1 Headless Moodle Implementation
**Why**: Complete frontend freedom while preserving Moodle's robust backend
**Benefits**:
- Modern UX/CDN-friendly architecture
- Independent frontend deployment cycles
- Better mobile experience
- Enhanced security through API gateway

#### 1.3.2 Microservices AI Integration
**Why**: AI features require separate infrastructure for optimal performance
**Benefits**:
- Independent scaling of AI services
- Technology flexibility (Python for AI, PHP for LMS)
- Fault isolation and resilience
- Easier A/B testing of AI features

#### 1.3.3 Event-Driven Architecture
**Why**: Real-time learning analytics and personalization
**Benefits**:
- Immediate learner progress tracking
- Live AI tutoring capabilities
- Scalable analytics processing
- Better user experience through real-time updates

### 1.4 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           LEARNER INTERACTION                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↓
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      ORBIT FRONTEND (Next.js)                                       │
│  • Capture learner interactions                                                  │
│  • Real-time UI updates                                                          │
│  • Predictive caching                                                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↓ Event Stream
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY & AUTHENTICATION                                 │
│  • Request validation and routing                                                │
│  • JWT/SAML authentication                                                      │
│  • Rate limiting and security                                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                              ↓ Parallel Processing
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  MOODLE API     │  NEBULA AI      │  SPECTRUM       │  POLARIS API    │  ANALYTICS      │
│  (Core Data)    │  (Tutoring)     │  (Learning)     │  (Blueprints)   │  (Events)       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
                                              ↓ Unified Storage
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-MODEL DATABASE                                     │
│  • PostgreSQL (Transactional)                                                   │
│  • Vector DB (Embeddings)                                                       │
│  • Redis (Cache/Sessions)                                                       │
│  • S3 (Content Files)                                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Solara Integration & Data Flow

### 2.1 Ecosystem Integration Strategy

Orbit LMS serves as the central delivery hub within the Solara ecosystem, seamlessly connecting with other products to create a unified learning experience.

#### 2.1.1 Integration Points Overview

```
POLARIS → ORBIT: Blueprint Import & Course Structure
├── Learning objectives alignment
├── Assessment strategy implementation
├── Content structure mapping
└── Success metrics configuration

CONSTELLATION → ORBIT: Automated Content Ingestion
├── Processed content delivery
├── Knowledge graph integration
├── Prerequisite mapping
└── Difficulty assessment data

ORBIT → NOVA: Learner Performance Data
├── Completion rates by content type
├── Assessment performance analytics
├── Learner engagement patterns
└── Content effectiveness metrics

ORBIT → NEBULA: Real-time Learning Context
├── Current learning objectives
├── Learner progress state
├── Knowledge gaps identification
└── Tutoring requests trigger

ORBIT → SPECTRUM: Comprehensive Learning Events
├── Micro-learning interactions
├── Assessment completion events
├── Social learning interactions
└── Performance analytics data
```

#### 2.1.2 Data Synchronization Architecture

**Event-Driven Integration Pattern**:

```typescript
// Integration Event Schema
interface SolaraEvent {
  eventId: string;
  eventType: 'LEARNER_PROGRESS' | 'CONTENT_INTERACTION' | 'ASSESSMENT_COMPLETE';
  source: 'orbit' | 'polaris' | 'nebula' | 'spectrum';
  timestamp: ISO8601;
  userId: string;
  sessionId: string;
  payload: {
    courseId: string;
    activityId?: string;
    data: Record<string, any>;
    metadata: {
      deviceInfo: string;
      location?: string;
      timeSpent: number;
    };
  };
}
```

**Real-time Synchronization Flow**:

1. **Learner Action Capture** (Orbit Frontend)
2. **Event Publishing** (Apache Kafka)
3. **Parallel Processing** (Multiple Microservices)
4. **Data Aggregation** (Spectrum Analytics)
5. **AI Response** (Nebula Tutoring)
6. **UI Updates** (Real-time WebSocket)

### 2.2 API Integration Specifications

#### 2.2.1 Polaris Integration (Blueprint Import)

```typescript
// API: /api/integrations/polaris/blueprints
interface PolarisBlueprintImport {
  blueprintId: string;
  courseId?: string; // Create new course if not provided
  importOptions: {
    includeLearningObjectives: boolean;
    includeAssessmentStrategy: boolean;
    includeSuccessMetrics: boolean;
    customizations: {
      adaptToLocalContext: boolean;
      languagePreferences: string[];
      difficultyAdjustment: 'auto' | 'manual';
    };
  };
}

// Response: Mapped course structure
interface CourseStructureResponse {
  courseId: string;
  courseCode: string;
  modules: CourseModule[];
  assessments: AssessmentPlan[];
  learningPath: LearningPathNode[];
  successMetrics: SuccessMetric[];
}
```

#### 2.2.2 Nebula AI Integration (Real-time Tutoring)

```typescript
// API: /api/integrations/nebula/tutoring
interface TutoringRequest {
  learnerId: string;
  courseId: string;
  currentActivity: {
    type: 'content' | 'assessment' | 'discussion';
    contentId: string;
    progress: number;
    timeSpent: number;
  };
  context: {
    learningObjectives: string[];
    recentInteractions: LearnerInteraction[];
    knowledgeState: KnowledgeGap[];
  };
  query?: string; // Specific learner question
}

// Real-time tutoring response
interface TutoringResponse {
  sessionId: string;
  response: {
    type: 'hint' | 'explanation' | 'example' | 'question';
    content: string;
    format: 'text' | 'interactive' | 'visual';
    resources: LearningResource[];
  };
  nextSteps: {
    recommended: LearningActivity[];
    adaptivePath: boolean;
  };
}
```

#### 2.2.3 Spectrum Analytics Integration

```typescript
// API: /api/integrations/spectrum/events
interface AnalyticsEventBatch {
  events: LearningEvent[];
  batchMetadata: {
    batchId: string;
    timestamp: ISO8601;
    sourceVersion: string;
  };
}

interface LearningEvent {
  eventType: 'page_view' | 'video_start' | 'quiz_attempt' | 'discussion_post' | 'resource_download';
  userId: string;
  sessionId: string;
  courseId: string;
  activityId: string;
  timestamp: ISO8601;
  properties: {
    duration?: number;
    score?: number;
    completion?: number;
    engagement_level: 'low' | 'medium' | 'high';
    device_type: string;
    location?: string;
  };
}
```

### 2.3 Unified Data Model

#### 2.3.1 Learner Profile Schema

```typescript
interface UnifiedLearnerProfile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    timezone: string;
    languagePreferences: string[];
  };
  learningProfile: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyPreference: 'gradual' | 'challenge';
    pacePreference: 'slow' | 'moderate' | 'fast';
    preferredContentTypes: ContentFormat[];
  };
  progressData: {
    totalCourses: number;
    completedCourses: number;
    averageCompletionTime: number;
    averageScore: number;
    skillLevels: SkillLevel[];
    knowledgeGaps: KnowledgeGap[];
  };
  aiPersonalization: {
    adaptivePathEnabled: boolean;
    tutoringStyle: 'formal' | 'conversational' | 'encouraging';
    feedbackFrequency: 'immediate' | 'periodic' | 'on_request';
  };
  enterpriseData?: {
    organizationId: string;
    departmentId: string;
    role: string;
    complianceRequirements: string[];
  };
}
```

---

## 3. Frontend Design System & Architecture

### 3.1 Smartslate Design System Implementation

The Orbit frontend will implement the complete Smartslate design system with emphasis on dark-first aesthetics, glassmorphism effects, and AI-enhanced interactions.

#### 3.1.1 Design Tokens Architecture

```typescript
// lib/design-system/tokens.ts
export const designTokens = {
  colors: {
    // Brand Colors (from styleguide)
    brand: {
      primary: {
        teal: '#a7dadb',
        tealRgb: '167, 218, 219',
        indigo: '#4F46E5',
        indigoRgb: '79, 70, 229',
      },
    },

    // Background System
    background: {
      primary: '#020C1B',      // Deep navy
      surface: '#0d1b2a',      // Elevated surface
      tertiary: '#142433',     // Interactive elements
      glass: 'rgba(255, 255, 255, 0.02)',
      glassStrong: 'rgba(255, 255, 255, 0.05)',
    },

    // Text Hierarchy
    text: {
      primary: '#e0e0e0',      // AAA contrast (14.3:1)
      secondary: '#b0c5c6',    // AA contrast (7.1:1)
      disabled: '#7a8a8b',     // AA contrast (4.5:1)
      inverse: '#020C1B',
    },

    // Semantic Colors
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },

    // Border System
    border: {
      standard: '#2a3a4a',
      accent: 'rgba(167, 218, 219, 0.1)',
      focus: 'rgba(167, 218, 219, 0.3)',
    },
  },

  typography: {
    fontFamily: {
      heading: '"Quicksand", system-ui, -apple-system, sans-serif',
      body: '"Lato", Georgia, serif',
      mono: '"JetBrains Mono", monospace',
    },

    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '0.25rem',     // 4px
    sm: '0.5rem',      // 8px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
    xl: '2rem',        // 32px
    '2xl': '3rem',     // 48px
    '3xl': '4rem',     // 64px
    '4xl': '6rem',     // 96px
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.5rem',      // 8px
    lg: '1rem',        // 16px
    xl: '1.5rem',      // 24px
    '2xl': '2rem',     // 32px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(167, 218, 219, 0.2)',
  },

  transitions: {
    fast: 'all 0.15s ease-in-out',
    base: 'all 0.3s ease-in-out',
    slow: 'all 0.5s ease-in-out',
  },

  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
} as const;
```

#### 3.1.2 Glassmorphism System

```css
/* styles/glassmorphism.css */
.glass-effect {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-effect-strong {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.45);
}

.glass-card {
  @apply glass-effect;
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(167, 218, 219, 0.1);
  border-color: rgba(167, 218, 219, 0.2);
}

.frosted-glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

### 3.2 Component Library Architecture

#### 3.2.1 Atomic Design Structure

```
components/
├── atoms/              # Smallest indivisible units
│   ├── buttons/
│   ├── inputs/
│   ├── badges/
│   ├── icons/
│   └── typography/
├── molecules/          # Simple groups of atoms
│   ├── cards/
│   ├── forms/
│   ├── breadcrumbs/
│   └── dropdowns/
├── organisms/          # Complex sections
│   ├── navigation/
│   ├── sidebar/
│   ├── course-grid/
│   └── modals/
├── templates/          # Page-level layouts
│   ├── course-view/
│   ├── dashboard/
│   └── profile/
└── pages/             # Complete pages
    ├── index.tsx
    ├── courses/
    └── dashboard/
```

#### 3.2.2 Core Component System

```typescript
// components/ui/button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: `
          bg-gradient-to-r from-indigo-600 to-indigo-700
          text-white shadow-lg hover:shadow-xl hover:scale-[1.02]
          border border-indigo-500/20
        `,
        secondary: `
          glass-effect border border-teal-500/30 text-teal-400
          hover:bg-teal-500/10 hover:border-teal-400/50 hover:text-teal-300
        `,
        ghost: `
          text-gray-300 hover:bg-gray-800/50 hover:text-gray-100
        `,
        glass: `
          glass-effect text-gray-200 hover:glass-effect-strong
          border border-gray-700/50 hover:border-teal-500/30
        `,
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        base: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'base',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### 3.2.3 Advanced AI-Enhanced Components

```typescript
// components/ai/smart-content-card.tsx
interface SmartContentCardProps {
  content: {
    id: string;
    title: string;
    type: 'video' | 'article' | 'quiz' | 'interactive';
    duration?: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    completionRate?: number;
    aiRecommendation?: {
      score: number;
      reasons: string[];
      adaptivePath: string[];
    };
  };
  learnerContext: {
    currentSkillLevel: number;
    learningGoals: string[];
    preferences: LearningPreferences;
  };
  onInteraction: (event: InteractionEvent) => void;
}

export const SmartContentCard: React.FC<SmartContentCardProps> = ({
  content,
  learnerContext,
  onInteraction,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);

  // AI-powered personalization
  useEffect(() => {
    const fetchAIInsights = async () => {
      const insights = await fetchPersonalizationInsights({
        contentId: content.id,
        learnerProfile: learnerContext,
      });
      setAiInsights(insights);
    };

    fetchAIInsights();
  }, [content.id, learnerContext]);

  return (
    <motion.div
      className="glass-card group cursor-pointer relative overflow-hidden"
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onInteraction({ type: 'content_selected', contentId: content.id })}
    >
      {/* AI Recommendation Badge */}
      {aiInsights?.recommendationScore > 0.8 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 backdrop-blur-sm border border-teal-400/30 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span className="text-xs text-teal-300 font-medium">
              {Math.round(aiInsights.recommendationScore * 100)}% Match
            </span>
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 relative overflow-hidden">
        <ContentThumbnail
          contentType={content.type}
          title={content.title}
          isPlaying={isHovered}
        />

        {/* Difficulty Indicator */}
        <div className="absolute bottom-2 left-2">
          <DifficultyBadge level={content.difficulty} />
        </div>

        {/* Duration */}
        {content.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-gray-300">
              {formatDuration(content.duration)}
            </span>
          </div>
        )}
      </div>

      {/* Content Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-100 group-hover:text-teal-400 transition-colors">
          {content.title}
        </h3>

        {/* AI Personalization Insights */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div className="flex flex-wrap gap-1">
              {aiInsights.reasons.map((reason, index) => (
                <span
                  key={index}
                  className="text-xs bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 px-2 py-1 rounded"
                >
                  {reason}
                </span>
              ))}
            </div>

            {aiInsights.adaptivePath.length > 0 && (
              <div className="text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Leads to: {aiInsights.adaptivePath[0]}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Indicator */}
        {content.completionRate !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>{content.completionRate}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${content.completionRate}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full mt-4"
          variant={content.completionRate === 100 ? "secondary" : "primary"}
        >
          {content.completionRate === 100 ? "Review" :
           content.completionRate ? "Continue" : "Start"}
        </Button>
      </div>
    </motion.div>
  );
};
```

### 3.3 State Management Architecture

#### 3.3.1 Zustand Store Structure

```typescript
// stores/learning-store.ts
interface LearningState {
  // Course state
  currentCourse: Course | null;
  courseProgress: CourseProgress;
  enrolledCourses: Course[];

  // Learner state
  learnerProfile: LearnerProfile;
  learningPath: LearningPath;

  // AI state
  aiRecommendations: AIRecommendation[];
  tutoringSession: TutoringSession | null;

  // UI state
  sidebarOpen: boolean;
  activeModule: string | null;

  // Actions
  setCurrentCourse: (course: Course) => void;
  updateProgress: (activityId: string, progress: number) => void;
  startTutoringSession: (context: TutoringContext) => void;
  receiveAIRecommendation: (recommendation: AIRecommendation) => void;
}

export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentCourse: null,
        courseProgress: {},
        enrolledCourses: [],
        learnerProfile: null,
        learningPath: null,
        aiRecommendations: [],
        tutoringSession: null,
        sidebarOpen: true,
        activeModule: null,

        // Actions
        setCurrentCourse: (course) => {
          set({ currentCourse: course });
          analytics.track('course_selected', { courseId: course.id });
        },

        updateProgress: (activityId, progress) => {
          const { currentCourse } = get();
          if (!currentCourse) return;

          const updatedProgress = {
            ...get().courseProgress,
            [activityId]: {
              ...get().courseProgress[activityId],
              progress,
              lastUpdated: new Date().toISOString(),
            },
          };

          set({ courseProgress: updatedProgress });

          // Trigger real-time events
          eventBus.publish('progress_updated', {
            courseId: currentCourse.id,
            activityId,
            progress,
          });

          // Request AI recommendations if significant progress
          if (progress > 0.8 && progress % 0.2 === 0) {
            requestAIRecommendations(currentCourse.id, activityId);
          }
        },

        startTutoringSession: (context) => {
          const session: TutoringSession = {
            id: generateId(),
            context,
            messages: [],
            isActive: true,
            startTime: new Date().toISOString(),
          };

          set({ tutoringSession: session });
          analytics.track('tutoring_session_started', { context });
        },

        receiveAIRecommendation: (recommendation) => {
          set(state => ({
            aiRecommendations: [...state.aiRecommendations, recommendation],
          }));
        },
      }),
      {
        name: 'orbit-learning-store',
        partialize: (state) => ({
          // Only persist essential data
          learnerProfile: state.learnerProfile,
          enrolledCourses: state.enrolledCourses,
          courseProgress: state.courseProgress,
        }),
      }
    )
  )
);
```

### 3.4 Real-time Communication System

#### 3.4.1 WebSocket Integration

```typescript
// lib/realtime/websocket.ts
class OrbitWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: any[] = [];
  private subscriptions = new Map<string, Set<Function>>();

  constructor(private url: string) {}

  connect() {
    try {
      this.ws = new WebSocket(`${this.url}?token=${getAuthToken()}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;

        // Send queued messages
        this.messageQueue.forEach(message => {
          this.ws?.send(JSON.stringify(message));
        });
        this.messageQueue = [];
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: any) {
    const { type, channel, data } = message;

    // Notify subscribers
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }

    // Handle special message types
    switch (type) {
      case 'AI_TUTORING_RESPONSE':
        store.dispatch(handleTutoringResponse(data));
        break;
      case 'PROGRESS_UPDATE':
        store.dispatch(handleProgressUpdate(data));
        break;
      case 'CONTENT_RECOMMENDATION':
        store.dispatch(handleContentRecommendation(data));
        break;
    }
  }

  subscribe(channel: string, callback: Function) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);

    // Send subscription message
    this.send({
      type: 'subscribe',
      channel,
    });

    return () => {
      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }
}

export const wsClient = new OrbitWebSocket(process.env.NEXT_PUBLIC_WS_URL!);
```

### 4.1 Modern Frontend Implementation Strategy

The Orbit frontend implementation will leverage Next.js 15 with App Router for optimal performance, SEO, and developer experience.

#### 4.1.1 Project Structure

```
orbit-frontend/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Route groups for authentication
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Learner dashboard
│   ├── courses/                  # Course-related pages
│   │   ├── [id]/
│   │   └── enroll/
│   ├── profile/                  # User profile
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── analytics/
│   │   └── integrations/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Component library
│   ├── ui/                      # Base UI components
│   ├── ai/                      # AI-enhanced components
│   ├── learning/                # Learning-specific components
│   └── layout/                  # Layout components
├── lib/                         # Utilities and configurations
│   ├── design-system/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── stores/                      # Zustand state management
├── types/                       # TypeScript definitions
├── public/                      # Static assets
├── styles/                      # Global styles
└── tests/                       # Test files
```

#### 4.1.2 Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@moodle/webservice'],
  },

  images: {
    domains: ['orbit.smartslate.io', 'cdn.smartslate.io'],
    formats: ['image/webp', 'image/avif'],
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  async rewrites() {
    return [
      // Moodle API proxy
      {
        source: '/api/moodle/:path*',
        destination: `${process.env.MOODLE_URL}/webservice/rest/server.php/:path*`,
      },
      // AI services proxy
      {
        source: '/api/ai/:path*',
        destination: `${process.env.AI_SERVICE_URL}/:path*`,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config for glassmorphism effects
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
```

#### 4.1.3 TailwindCSS Configuration with Smartslate Design System

```javascript
// tailwind.config.js
const { designTokens } = require('./lib/design-system/tokens');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Smartslate color system
        primary: designTokens.colors.brand.primary,
        background: designTokens.colors.background,
        text: designTokens.colors.text,
        semantic: designTokens.colors.semantic,
        border: designTokens.colors.border,

        // Glass effects
        glass: {
          light: 'rgba(255, 255, 255, 0.02)',
          medium: 'rgba(255, 255, 255, 0.05)',
          strong: 'rgba(255, 255, 255, 0.08)',
        },
      },

      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,

      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glass-morphism': 'glassMorphism 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glassMorphism: {
          '0%': {
            background: 'rgba(255, 255, 255, 0)',
            backdropFilter: 'blur(0px)',
          },
          '100%': {
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(12px)',
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(167, 218, 219, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(167, 218, 219, 0.4)',
          },
        },
      },

      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),

    // Custom plugin for glassmorphism
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        '.glass-hover': {
          transition: 'all 0.3s ease',
        },
        '.glass-hover:hover': {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(167, 218, 219, 0.2)',
          transform: 'translateY(-2px)',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
```

---

## 5. Phase 2: Modern Frontend Implementation

**Duration**: 4-5 weeks
**Priority**: Critical

### 5.1 Core Application Structure

#### 5.1.1 Root Layout Configuration

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Orbit LMS - AI-Powered Learning',
  description: 'Personalized learning delivery powered by AI',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#020C1B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

#### 5.1.2 Global Providers Configuration

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { WSProvider } from '@/components/providers/ws-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && 'status' in error) {
                return error.status >= 500 && failureCount < 3;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Initialize auth and WebSocket
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <WSProvider>
          <AnalyticsProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </AnalyticsProvider>
        </WSProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 5.2 Dashboard Implementation

#### 5.2.1 Learner Dashboard

```typescript
// app/dashboard/page.tsx
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { LearningPath } from '@/components/dashboard/learning-path';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { AIRecommendations } from '@/components/ai/ai-recommendations';
import { ProgressOverview } from '@/components/dashboard/progress-overview';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary to-background-surface">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <LearningPath />
            <RecentActivity />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <ProgressOverview />
            <AIRecommendations />
            <UpcomingDeadlines />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 5.2.2 AI-Powered Learning Path Component

```typescript
// components/dashboard/learning-path.tsx
'use client';

import { motion } from 'framer-motion';
import { useLearningStore } from '@/stores/learning-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Target, Zap } from 'lucide-react';

export function LearningPath() {
  const { currentCourse, courseProgress, aiRecommendations } = useLearningStore();

  if (!currentCourse) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
          <p className="text-gray-400 mb-6">
            Enroll in a course to begin your personalized learning experience
          </p>
          <Button>Explore Courses</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-effect-strong overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Your Learning Path
            </CardTitle>
            <Badge variant="secondary" className="glass-effect">
              {currentCourse.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Module */}
          <div className="p-6 rounded-lg bg-gradient-to-r from-indigo-500/10 to-teal-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">{currentCourse.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {currentCourse.estimatedDuration}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentCourse.progress}%</span>
              </div>
              <Progress
                value={currentCourse.progress}
                className="h-2 bg-gray-700"
              />
            </div>
          </div>

          {/* AI Recommendations */}
          {aiRecommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="font-semibold">AI Recommendations</h4>
              </div>

              <div className="space-y-2">
                {aiRecommendations.slice(0, 3).map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-teal-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{recommendation.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {recommendation.reason}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.priority}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="flex gap-3">
            <Button className="flex-1">
              Continue Learning
            </Button>
            <Button variant="ghost">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

## 8. Phase 5: AI Integration Layer

**Duration**: 4 weeks
**Priority**: High

### 8.1 Microservices Architecture

#### 8.1.1 AI Gateway Service

```python
# ai-gateway/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
from contextlib import asynccontextmanager

app = FastAPI(title="Orbit AI Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://orbit.smartslate.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Service Registry
AI_SERVICES = {
    "nebula": "http://nebula-service:8001",
    "polaris": "http://polaris-service:8002",
    "spectrum": "http://spectrum-service:8003",
    "personalization": "http://personalization-service:8004",
}

class AIRequest(BaseModel):
    service: str
    endpoint: str
    payload: dict
    user_id: str
    context: Optional[dict] = None

class AIResponse(BaseModel):
    success: bool
    data: dict
    metadata: dict
    processing_time: float

async def verify_auth_token(token: str) -> dict:
    """Verify JWT token with Solara auth service"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{os.getenv('AUTH_SERVICE_URL')}/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()

async def route_to_ai_service(request: AIRequest) -> AIResponse:
    """Route request to appropriate AI service"""
    if request.service not in AI_SERVICES:
        raise HTTPException(status_code=400, detail="Invalid AI service")

    service_url = AI_SERVICES[request.service]
    endpoint_url = f"{service_url}/{request.endpoint}"

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                endpoint_url,
                json={
                    **request.payload,
                    "user_id": request.user_id,
                    "context": request.context,
                },
                headers={
                    "X-Request-ID": generate_request_id(),
                    "X-User-ID": request.user_id,
                }
            )

        processing_time = time.time() - start_time

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"AI service error: {response.text}"
            )

        return AIResponse(
            success=True,
            data=response.json(),
            metadata={
                "service": request.service,
                "processing_time": processing_time,
                "request_id": response.headers.get("X-Request-ID"),
            },
            processing_time=processing_time,
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI gateway error: {str(e)}")

@app.post("/api/v1/request", response_model=AIResponse)
async def handle_ai_request(
    request: AIRequest,
    auth_data: dict = Depends(get_current_user)
):
    """Main endpoint for routing AI requests"""
    return await route_to_ai_service(request)

@app.post("/api/v1/nebula/tutoring")
async def nebula_tutoring(
    payload: dict,
    auth_data: dict = Depends(get_current_user)
):
    """Dedicated endpoint for Nebula tutoring requests"""
    request = AIRequest(
        service="nebula",
        endpoint="tutor",
        payload=payload,
        user_id=auth_data["user_id"],
        context=auth_data.get("context", {})
    )
    return await route_to_ai_service(request)

@app.post("/api/v1/personalization/recommendations")
async def get_recommendations(
    payload: dict,
    auth_data: dict = Depends(get_current_user)
):
    """Get personalized content recommendations"""
    request = AIRequest(
        service="personalization",
        endpoint="recommend",
        payload=payload,
        user_id=auth_data["user_id"],
        context={
            "current_course": payload.get("course_id"),
            "learning_objectives": payload.get("objectives", []),
            "skill_level": auth_data.get("profile", {}).get("skill_level", "intermediate"),
        }
    )
    return await route_to_ai_service(request)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "services": list(AI_SERVICES.keys())}
```

#### 8.1.2 Real-time Tutoring Service (Nebula)

```python
# nebula-service/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import json
from datetime import datetime
import openai
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.llms import OpenAI

app = FastAPI(title="Nebula AI Tutoring Service")

class TutoringSession:
    def __init__(self, session_id: str, user_id: str, context: dict):
        self.session_id = session_id
        self.user_id = user_id
        self.context = context
        self.conversation_history = []
        self.learning_objectives = context.get("learning_objectives", [])
        self.current_difficulty = context.get("difficulty", "intermediate")
        self.memory = ConversationBufferMemory()

        # Initialize AI tutor with context
        self.llm = OpenAI(
            model="gpt-4",
            temperature=0.7,
            max_tokens=500,
        )
        self.chain = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            verbose=True
        )

    async def get_tutoring_response(self, user_message: str) -> dict:
        """Generate AI tutoring response"""
        try:
            # Create tutoring prompt with context
            system_prompt = self._create_tutoring_prompt()

            # Add system message to conversation
            self.memory.chat_memory.add_ai_message(system_prompt)

            # Get response from AI
            response = await self.chain.arun(user_message)

            # Analyze response for learning insights
            insights = await self._analyze_response(response)

            # Store conversation
            self.conversation_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "user_message": user_message,
                "ai_response": response,
                "insights": insights,
            })

            return {
                "response": response,
                "insights": insights,
                "suggestions": await self._generate_suggestions(),
                "session_metadata": {
                    "message_count": len(self.conversation_history),
                    "current_objective": self._get_current_objective(),
                    "difficulty_adjustment": self._suggest_difficulty_adjustment(),
                }
            }

        except Exception as e:
            return {
                "response": f"I apologize, but I'm having trouble responding right now. Please try again.",
                "error": str(e),
                "fallback_response": True
            }

    def _create_tutoring_prompt(self) -> str:
        """Create context-aware tutoring prompt"""
        return f"""
        You are an expert AI tutor for the Orbit learning platform. Your role is to:

        1. Help the learner understand {self.context.get('subject', 'the current topic')}
        2. Provide clear, encouraging explanations
        3. Ask questions to check understanding
        4. Adapt your teaching style to {self.current_difficulty} level
        5. Connect concepts to real-world applications

        Current learning objectives:
        {', '.join(self.learning_objectives)}

        Previous conversation context shows the learner is working on:
        {self.context.get('current_activity', 'course material')}

        Be encouraging, patient, and provide step-by-step explanations.
        If the learner seems stuck, break down the concept into smaller pieces.
        """

    async def _analyze_response(self, response: str) -> dict:
        """Analyze AI response for learning insights"""
        # Use AI to analyze the tutoring interaction
        analysis_prompt = f"""
        Analyze this tutoring response for learning insights:

        Response: {response}

        Provide insights on:
        1. What concepts were explained
        2. What questions were asked
        3. Difficulty level appropriateness
        4. Suggested follow-up topics
        5. Learner engagement indicators

        Return as JSON with keys: concepts, questions, difficulty, follow_ups, engagement
        """

        try:
            analysis = await self.llm.arun(analysis_prompt)
            return json.loads(analysis)
        except:
            return {
                "concepts": ["general explanation"],
                "questions": ["understanding check"],
                "difficulty": self.current_difficulty,
                "follow_ups": ["practice problems"],
                "engagement": "medium"
            }

# Active tutoring sessions
active_sessions: Dict[str, TutoringSession] = {}

@app.websocket("/tutor/{session_id}")
async def tutoring_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        # Initialize session
        data = await websocket.receive_json()
        user_id = data["user_id"]
        context = data["context"]

        session = TutoringSession(session_id, user_id, context)
        active_sessions[session_id] = session

        # Send welcome message
        welcome_response = await session.get_tutoring_response(
            "Hi! I'm your AI tutor. What would you like help with today?"
        )
        await websocket.send_json(welcome_response)

        # Handle conversation
        while True:
            data = await websocket.receive_json()
            user_message = data["message"]

            # Generate AI response
            response = await session.get_tutoring_response(user_message)
            await websocket.send_json(response)

    except WebSocketDisconnect:
        if session_id in active_sessions:
            del active_sessions[session_id]

@app.post("/tutor/chat")
async def tutor_chat(request: dict):
    """HTTP endpoint for tutoring requests"""
    session_id = request.get("session_id", f"session_{datetime.now().timestamp()}")
    user_id = request["user_id"]
    message = request["message"]
    context = request.get("context", {})

    # Get or create session
    if session_id not in active_sessions:
        active_sessions[session_id] = TutoringSession(session_id, user_id, context)

    session = active_sessions[session_id]
    response = await session.get_tutoring_response(message)

    return {
        "session_id": session_id,
        "response": response,
    }
```

---

## 11. Phase 8: Testing & Quality Assurance

**Duration**: 3 weeks
**Priority**: High

### 11.1 Comprehensive Testing Strategy

#### 11.1.1 Frontend Testing Architecture

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
```

#### 11.1.2 Component Testing Examples

```typescript
// tests/components/ai/smart-content-card.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartContentCard } from '@/components/ai/smart-content-card';
import { vi } from 'vitest';

// Mock AI service
vi.mock('@/lib/services/ai-service', () => ({
  fetchPersonalizationInsights: vi.fn().mockResolvedValue({
    recommendationScore: 0.85,
    reasons: ['matches learning style', 'appropriate difficulty'],
    adaptivePath: ['Advanced JavaScript', 'React Patterns'],
  }),
}));

const mockContent = {
  id: 'content-1',
  title: 'Introduction to React Hooks',
  type: 'interactive' as const,
  duration: 1800,
  difficulty: 'intermediate' as const,
  completionRate: 45,
};

const mockLearnerContext = {
  currentSkillLevel: 0.6,
  learningGoals: ['React mastery', 'TypeScript integration'],
  preferences: {
    learningStyle: 'visual' as const,
    pacePreference: 'moderate' as const,
  },
};

describe('SmartContentCard', () => {
  it('renders content information correctly', () => {
    const onInteraction = vi.fn();

    render(
      <SmartContentCard
        content={mockContent}
        learnerContext={mockLearnerContext}
        onInteraction={onInteraction}
      />
    );

    expect(screen.getByText('Introduction to React Hooks')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays AI recommendation badge for high match scores', async () => {
    const onInteraction = vi.fn();

    render(
      <SmartContentCard
        content={mockContent}
        learnerContext={mockLearnerContext}
        onInteraction={onInteraction}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('85% Match')).toBeInTheDocument();
      expect(screen.getByText(/matches learning style/)).toBeInTheDocument();
    });
  });

  it('handles interaction events correctly', async () => {
    const onInteraction = vi.fn();

    render(
      <SmartContentCard
        content={mockContent}
        learnerContext={mockLearnerContext}
        onInteraction={onInteraction}
      />
    );

    const card = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(card);

    expect(onInteraction).toHaveBeenCalledWith({
      type: 'content_selected',
      contentId: 'content-1',
    });
  });

  it('shows correct button state based on completion', () => {
    const onInteraction = vi.fn();

    const completedContent = { ...mockContent, completionRate: 100 };

    render(
      <SmartContentCard
        content={completedContent}
        learnerContext={mockLearnerContext}
        onInteraction={onInteraction}
      />
    );

    expect(screen.getByText('Review')).toBeInTheDocument();
  });
});
```

#### 11.1.3 Integration Testing with Moodle API

```typescript
// tests/integration/moodle-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MoodleAPIClient } from '@/lib/services/moodle-api';

describe('Moodle API Integration', () => {
  let client: MoodleAPIClient;
  let testUserId: string;
  let testCourseId: string;

  beforeAll(async () => {
    client = new MoodleAPIClient({
      baseURL: process.env.VITE_MOODLE_URL,
      token: process.env.VITE_MOODLE_TOKEN,
    });

    // Create test user
    const user = await client.createUser({
      username: 'test-user-orbit',
      email: 'test@orbit.smartslate.io',
      firstname: 'Test',
      lastname: 'User',
    });
    testUserId = user.id;

    // Create test course
    const course = await client.createCourse({
      fullname: 'Orbit Integration Test Course',
      shortname: 'orbit-test-001',
      categoryid: 1,
    });
    testCourseId = course.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await client.deleteUser(testUserId);
    await client.deleteCourse(testCourseId);
  });

  it('should authenticate with Moodle API', async () => {
    const userInfo = await client.getSiteInfo();
    expect(userInfo).toHaveProperty('userid');
    expect(userInfo).toHaveProperty('siteurl');
  });

  it('should enroll user in course', async () => {
    const enrollment = await client.enrollUser({
      userid: testUserId,
      courseid: testCourseId,
      roleid: 5, // Student role
    });

    expect(enrollment).toHaveProperty('status', 'enrolled');
  });

  it('should retrieve course content', async () => {
    const courseContent = await client.getCourseContent(testCourseId);

    expect(Array.isArray(courseContent)).toBe(true);
    if (courseContent.length > 0) {
      expect(courseContent[0]).toHaveProperty('id');
      expect(courseContent[0]).toHaveProperty('name');
      expect(courseContent[0]).toHaveProperty('modules');
    }
  });

  it('should track user progress', async () => {
    // Mark a module as complete
    const progress = await client.setModuleCompletion({
      userid: testUserId,
      coursemoduleid: 1, // Assuming module ID 1 exists
      completionstate: 1, // Complete
    });

    expect(progress).toHaveProperty('status', 'success');
  });
});
```

### 11.2 Performance Testing

#### 11.2.1 Load Testing Configuration

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const responseTime = new Rate('response_time_ok');
const errorRate = new Rate('error_rate');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    response_time_ok: ['rate>0.95'],   // Response time success rate
  },
};

const BASE_URL = 'https://orbit.smartslate.io';

export default function() {
  // Test dashboard loading
  const dashboardResponse = http.get(`${BASE_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const dashboardOk = check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    'dashboard content present': (r) => r.body.includes('Your Learning Path'),
  });

  responseTime.add(dashboardOk);
  errorRate.add(!dashboardOk);

  // Test course loading
  const courseResponse = http.get(`${BASE_URL}/api/courses/1`, {
    headers: {
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  });

  const courseOk = check(courseResponse, {
    'course API status is 200': (r) => r.status === 200,
    'course API response time < 300ms': (r) => r.timings.duration < 300,
    'course data valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.id && data.title;
      } catch {
        return false;
      }
    },
  });

  responseTime.add(courseOk);
  errorRate.add(!courseOk);

  // Test AI recommendation endpoint
  const aiResponse = http.post(`${BASE_URL}/api/ai/recommendations`,
    JSON.stringify({
      user_id: 'test-user-123',
      course_id: '1',
      context: {
        current_progress: 0.5,
        learning_objectives: ['React mastery'],
      },
    }),
    {
      headers: {
        'Authorization': `Bearer ${__ENV.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const aiOk = check(aiResponse, {
    'AI API status is 200': (r) => r.status === 200,
    'AI API response time < 2000ms': (r) => r.timings.duration < 2000,
    'AI recommendations valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.recommendations);
      } catch {
        return false;
      }
    },
  });

  responseTime.add(aiOk);
  errorRate.add(!aiOk);

  sleep(1);
}
```

This comprehensive implementation plan provides a complete technical blueprint for building Orbit LMS as a modern, AI-powered learning platform that stays true to the Solara vision while leveraging Moodle's proven backend capabilities. The plan covers:

1. **Modern Architecture**: Headless Moodle with Next.js 15 frontend
2. **Complete Design System**: Full Smartslate design implementation with glassmorphism
3. **AI Integration**: Comprehensive microservices architecture for AI features
4. **Real-time Features**: WebSocket communication and live updates
5. **Testing Strategy**: Unit, integration, and performance testing
6. **Quality Assurance**: Comprehensive testing coverage and CI/CD pipeline

The implementation focuses on creating an enterprise-grade, scalable learning platform that delivers on the Solara vision of unified, AI-native learning infrastructure.

---

### 2.1 Moodle Installation & Configuration

#### 2.1.1 Server Setup

```bash
# 1. Install dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install nginx postgresql redis php8.1-fpm php8.1-pgsql \
  php8.1-redis php8.1-xml php8.1-mbstring php8.1-curl \
  php8.1-zip php8.1-gd php8.1-intl php8.1-soap

# 2. Create database
sudo -u postgres psql
CREATE DATABASE moodle;
CREATE USER moodleuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE moodle TO moodleuser;
\q

# 3. Download Moodle
cd /var/www
sudo git clone -b MOODLE_403_STABLE https://github.com/moodle/moodle.git orbit-moodle
sudo mkdir /var/moodledata
sudo chown -R www-data:www-data /var/www/orbit-moodle /var/moodledata
sudo chmod -R 755 /var/moodledata
```

#### 2.1.2 Moodle Configuration

Create `/var/www/orbit-moodle/config.php`:

```php
<?php
unset($CFG);
global $CFG;
$CFG = new stdClass();

$CFG->dbtype    = 'pgsql';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'localhost';
$CFG->dbname    = 'moodle';
$CFG->dbuser    = 'moodleuser';
$CFG->dbpass    = 'secure_password';
$CFG->prefix    = 'mdl_';
$CFG->dboptions = array(
    'dbpersist' => 0,
    'dbport' => '',
    'dbsocket' => '',
);

$CFG->wwwroot   = 'https://orbit.smartslate.io';
$CFG->dataroot  = '/var/moodledata';
$CFG->admin     = 'admin';

$CFG->directorypermissions = 0777;

// Performance optimizations
$CFG->cachedir = '/var/moodledata/cache';
$CFG->localcachedir = '/var/moodledata/localcache';
$CFG->session_handler_class = '\core\session\redis';
$CFG->session_redis_host = '127.0.0.1';
$CFG->session_redis_port = 6379;

// Custom settings for Orbit
$CFG->theme = 'orbit';
$CFG->customusermenuitems = '';

require_once(__DIR__ . '/lib/setup.php');
?>
```

### 2.2 Moodle Analysis & Mapping

#### 2.2.1 Core Features to Retain

Create a comprehensive audit document:

**File**: `audit/moodle-features-audit.md`

| Feature Category | Moodle Component | Keep/Modify/Replace | Priority |
|-----------------|------------------|---------------------|----------|
| User Management | core_user | Keep backend, new UI | High |
| Course Management | core_course | Keep backend, new UI | High |
| Enrollment | core_enrol | Keep backend, new UI | High |
| Activities | mod_* plugins | Keep backend, new UI | High |
| Assessments | mod_quiz, mod_assign | Keep backend, new UI | High |
| Grading | core_grades | Keep backend, new UI | Medium |
| Reports | core_report | Replace with custom analytics | High |
| Messaging | core_message | Enhance with real-time | Medium |
| Files | core_files | Keep, optimize storage | High |
| Roles/Permissions | core_role | Keep, simplify UI | High |
| Backup/Restore | core_backup | Keep | Low |
| Plugins | core_plugin | Keep architecture | High |

#### 2.2.2 Database Schema Analysis

```bash
# Export Moodle schema for documentation
pg_dump -U moodleuser -d moodle --schema-only > docs/moodle-schema.sql

# Identify key tables for API development
# Priority tables:
# - mdl_user (users)
# - mdl_course (courses)
# - mdl_course_modules (activities)
# - mdl_grade_items (assessments)
# - mdl_enrol (enrollment methods)
# - mdl_role_assignments (permissions)
# - mdl_context (access control)
```

### 2.3 Development Environment

#### 2.3.1 Version Control Setup

```bash
# Initialize Git repository
cd /var/www/orbit-moodle
git init
git remote add origin https://github.com/smartslate/orbit-lms.git

# Create .gitignore
cat > .gitignore << EOF
config.php
/moodledata/
.env
node_modules/
dist/
build/
*.log
.DS_Store
EOF

# Create branch structure
git checkout -b main
git checkout -b develop
git checkout -b feature/theme-foundation
```

#### 2.3.2 Docker Development Environment (Optional)

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  web:
    image: php:8.1-fpm-alpine
    volumes:
      - ./orbit-moodle:/var/www/html
      - ./moodledata:/var/moodledata
    depends_on:
      - db
      - redis
    environment:
      - PHP_MEMORY_LIMIT=512M
      - PHP_UPLOAD_MAX_FILESIZE=100M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./orbit-moodle:/var/www/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web

  db:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: moodle
      POSTGRES_USER: moodleuser
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  frontend:
    build: ./orbit-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./orbit-frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost/webservice/rest/server.php

volumes:
  postgres_data:
```

---

## 3. Phase 2: Theme & Frontend Foundation

**Duration**: 3-4 weeks  
**Priority**: Critical

### 3.1 Moodle Theme Creation

#### 3.1.1 Theme Structure

```bash
# Create custom theme directory
mkdir -p theme/orbit
cd theme/orbit

# Create theme structure
mkdir -p {classes,db,lang/en,layout,pix,scss,templates,javascript}
```

#### 3.1.2 Theme Configuration

**File**: `theme/orbit/config.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$THEME->name = 'orbit';
$THEME->parents = ['boost']; // Inherit from Boost theme
$THEME->sheets = [];
$THEME->supportscssoptimisation = false;
$THEME->yuicssmodules = [];
$THEME->enable_dock = false;
$THEME->editor_sheets = [];

$THEME->layouts = [
    'base' => array(
        'file' => 'columns.php',
        'regions' => array(),
    ),
    'standard' => array(
        'file' => 'columns.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'course' => array(
        'file' => 'course.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'coursecategory' => array(
        'file' => 'columns.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'incourse' => array(
        'file' => 'incourse.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'frontpage' => array(
        'file' => 'frontpage.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'admin' => array(
        'file' => 'columns.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'mydashboard' => array(
        'file' => 'dashboard.php',
        'regions' => array('side-pre'),
        'defaultregion' => 'side-pre',
    ),
    'login' => array(
        'file' => 'login.php',
        'regions' => array(),
    ),
];

$THEME->rendererfactory = 'theme_overridden_renderer_factory';
$THEME->csspostprocess = 'theme_orbit_process_css';
?>
```

#### 3.1.3 Version Information

**File**: `theme/orbit/version.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025102900;
$plugin->requires  = 2023100900; // Moodle 4.3+
$plugin->component = 'theme_orbit';
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = '1.0.0';
?>
```

### 3.2 Design System Implementation

#### 3.2.1 SCSS Foundation

**File**: `theme/orbit/scss/orbit.scss`

```scss
// ==========================================
// Orbit LMS Design System
// Based on Smartslate Brand Guidelines
// ==========================================

// CSS Custom Properties (Design Tokens)
:root {
  // Brand Colors
  --color-primary-teal: #a7dadb;
  --color-primary-teal-rgb: 167, 218, 219;
  --color-secondary-indigo: #4F46E5;
  --color-secondary-indigo-rgb: 79, 70, 229;
  
  // Background System
  --color-bg-primary: #020C1B;
  --color-bg-surface: #0d1b2a;
  --color-bg-tertiary: #142433;
  
  // Text Hierarchy
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #b0c5c6;
  --color-text-disabled: #7a8a8b;
  
  // Semantic Colors
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  // Border & Dividers
  --color-border-standard: #2a3a4a;
  --color-border-accent: rgba(167, 218, 219, 0.1);
  
  // Typography
  --font-heading: 'Quicksand', system-ui, -apple-system, sans-serif;
  --font-body: 'Lato', Georgia, serif;
  
  // Spacing Scale (8px base)
  --space-xs: 0.25rem;    // 4px
  --space-sm: 0.5rem;     // 8px
  --space-md: 1rem;       // 16px
  --space-lg: 1.5rem;     // 24px
  --space-xl: 2rem;       // 32px
  --space-2xl: 3rem;      // 48px
  --space-3xl: 4rem;      // 64px
  --space-4xl: 6rem;      // 96px
  
  // Border Radius
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-full: 9999px;
  
  // Shadows
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  
  // Transitions
  --transition-fast: all 0.2s ease-in-out;
  --transition-medium: all 0.3s ease-in-out;
  --transition-slow: all 0.5s ease-in-out;
  
  // Z-index layers
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

// ==========================================
// Base Styles
// ==========================================

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// ==========================================
// Typography Scale
// ==========================================

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-primary-teal);
  font-weight: 700;
  margin-bottom: var(--space-lg);
}

h1 {
  font-size: clamp(2.25rem, 2vw + 1.5rem, 3.5rem);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

h2 {
  font-size: clamp(1.875rem, 1.2vw + 1.25rem, 2.5rem);
  line-height: 1.25;
  letter-spacing: -0.01em;
}

h3 {
  font-size: clamp(1.5rem, 0.8vw + 1.1rem, 2rem);
  line-height: 1.3;
}

h4 {
  font-size: clamp(1.25rem, 0.6vw + 1rem, 1.5rem);
  line-height: 1.35;
}

h5 {
  font-size: clamp(1.125rem, 0.4vw + 0.95rem, 1.25rem);
  line-height: 1.4;
}

h6 {
  font-size: 1rem;
  line-height: 1.45;
}

p {
  margin-bottom: var(--space-md);
}

a {
  color: var(--color-primary-teal);
  text-decoration: none;
  transition: var(--transition-fast);
  
  &:hover {
    color: var(--color-secondary-indigo);
    text-decoration: underline;
  }
}

// ==========================================
// Glass Effect Utility
// ==========================================

@mixin glass-effect($opacity: 0.02) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-effect {
  @include glass-effect();
}

.glass-effect-strong {
  @include glass-effect(0.05);
}

// ==========================================
// Card Component
// ==========================================

.orbit-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-standard);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: var(--transition-fast);
  
  &:hover {
    border-color: var(--color-border-accent);
    box-shadow: var(--shadow-xl);
    transform: translateY(-2px);
  }
  
  &.glass {
    @include glass-effect();
  }
}

// ==========================================
// Button System
// ==========================================

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
  text-decoration: none;
  
  &:focus {
    outline: 3px solid var(--color-primary-teal);
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-secondary-indigo), #3730a3);
  color: #ffffff;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3730a3, #312e81);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--color-primary-teal);
  color: var(--color-primary-teal);
  
  &:hover:not(:disabled) {
    background: rgba(167, 218, 219, 0.1);
    transform: translateY(-2px);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  
  &:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
  }
}

// Size variations
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
}

// ==========================================
// Input System
// ==========================================

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-standard);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  transition: var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-teal);
    box-shadow: 0 0 0 3px rgba(167, 218, 219, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ==========================================
// Navigation & Header
// ==========================================

.orbit-navbar {
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-standard);
  padding: var(--space-md) 0;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  @include glass-effect();
  
  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
  }
  
  .navbar-brand {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary-teal);
  }
  
  .navbar-nav {
    display: flex;
    gap: var(--space-lg);
    list-style: none;
    
    a {
      color: var(--color-text-secondary);
      font-weight: 600;
      
      &:hover {
        color: var(--color-primary-teal);
      }
      
      &.active {
        color: var(--color-primary-teal);
      }
    }
  }
}

// ==========================================
// Sidebar
// ==========================================

.orbit-sidebar {
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border-standard);
  padding: var(--space-lg);
  height: 100vh;
  position: fixed;
  width: 280px;
  overflow-y: auto;
  
  .sidebar-section {
    margin-bottom: var(--space-xl);
    
    .section-title {
      color: var(--color-text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-md);
    }
    
    .sidebar-menu {
      list-style: none;
      
      li {
        margin-bottom: var(--space-xs);
        
        a {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          transition: var(--transition-fast);
          
          &:hover {
            background: var(--color-bg-tertiary);
            color: var(--color-primary-teal);
            text-decoration: none;
          }
          
          &.active {
            background: rgba(167, 218, 219, 0.1);
            color: var(--color-primary-teal);
            font-weight: 600;
          }
        }
      }
    }
  }
}

// ==========================================
// Main Content Area
// ==========================================

.orbit-main {
  margin-left: 280px;
  padding: var(--space-2xl) var(--space-xl);
  min-height: 100vh;
}

// ==========================================
// Course Card
// ==========================================

.course-card {
  @extend .orbit-card;
  overflow: hidden;
  
  .course-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    margin: calc(var(--space-lg) * -1) calc(var(--space-lg) * -1) var(--space-md);
  }
  
  .course-title {
    font-size: 1.25rem;
    margin-bottom: var(--space-sm);
  }
  
  .course-description {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    margin-bottom: var(--space-lg);
  }
  
  .course-meta {
    display: flex;
    gap: var(--space-md);
    font-size: 0.875rem;
    color: var(--color-text-disabled);
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }
  }
  
  .course-progress {
    margin-top: var(--space-md);
    
    .progress-bar {
      height: 6px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary-teal), var(--color-secondary-indigo));
        transition: width 0.5s ease;
      }
    }
    
    .progress-text {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-xs);
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }
  }
}

// ==========================================
// Dashboard Grid
// ==========================================

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

// ==========================================
// Modal
// ==========================================

.orbit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  
  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: var(--z-modal-backdrop);
  }
  
  .modal-content {
    position: relative;
    z-index: var(--z-modal);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-standard);
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-xl);
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
      
      h3 {
        margin: 0;
      }
      
      .modal-close {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: var(--space-xs);
        line-height: 1;
        
        &:hover {
          color: var(--color-text-primary);
        }
      }
    }
  }
}

// ==========================================
// Responsive Design
// ==========================================

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;

@media (max-width: $breakpoint-lg) {
  .orbit-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.active {
      transform: translateX(0);
    }
  }
  
  .orbit-main {
    margin-left: 0;
  }
  
  .dashboard-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
  }
}

@media (max-width: $breakpoint-md) {
  .orbit-navbar {
    .navbar-nav {
      display: none; // Implement mobile menu
    }
  }
  
  .orbit-main {
    padding: var(--space-xl) var(--space-md);
  }
  
  h1 {
    font-size: 2rem;
  }
  
  h2 {
    font-size: 1.75rem;
  }
}

// ==========================================
// Accessibility
// ==========================================

// Focus visible for keyboard navigation
*:focus-visible {
  outline: 3px solid var(--color-primary-teal);
  outline-offset: 2px;
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  :root {
    --color-text-primary: #ffffff;
    --color-bg-primary: #000000;
    --color-border-standard: #ffffff;
  }
}

// ==========================================
// Print Styles
// ==========================================

@media print {
  .orbit-navbar,
  .orbit-sidebar,
  .btn {
    display: none;
  }
  
  .orbit-main {
    margin-left: 0;
  }
  
  body {
    background: white;
    color: black;
  }
}

// ==========================================
// Utility Classes
// ==========================================

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-disabled { color: var(--color-text-disabled); }
.text-teal { color: var(--color-primary-teal); }
.text-indigo { color: var(--color-secondary-indigo); }

.bg-primary { background-color: var(--color-bg-primary); }
.bg-surface { background-color: var(--color-bg-surface); }
.bg-tertiary { background-color: var(--color-bg-tertiary); }

.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }

.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }

// Spacing utilities
@each $size, $value in (xs: var(--space-xs), sm: var(--space-sm), md: var(--space-md), lg: var(--space-lg), xl: var(--space-xl), 2xl: var(--space-2xl), 3xl: var(--space-3xl)) {
  .m-#{$size} { margin: $value; }
  .mt-#{$size} { margin-top: $value; }
  .mr-#{$size} { margin-right: $value; }
  .mb-#{$size} { margin-bottom: $value; }
  .ml-#{$size} { margin-left: $value; }
  .mx-#{$size} { margin-left: $value; margin-right: $value; }
  .my-#{$size} { margin-top: $value; margin-bottom: $value; }
  
  .p-#{$size} { padding: $value; }
  .pt-#{$size} { padding-top: $value; }
  .pr-#{$size} { padding-right: $value; }
  .pb-#{$size} { padding-bottom: $value; }
  .pl-#{$size} { padding-left: $value; }
  .px-#{$size} { padding-left: $value; padding-right: $value; }
  .py-#{$size} { padding-top: $value; padding-bottom: $value; }
}
```

### 3.3 Custom Layouts

#### 3.3.1 Base Layout Template

**File**: `theme/orbit/layout/columns.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$bodyattributes = $OUTPUT->body_attributes();
$siteurl = new moodle_url('/');

echo $OUTPUT->doctype();
?>
<html <?php echo $OUTPUT->htmlattributes(); ?>>
<head>
    <title><?php echo $OUTPUT->page_title(); ?></title>
    <link rel="icon" type="image/x-icon" href="<?php echo $OUTPUT->image_url('favicon', 'theme'); ?>">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
    
    <?php echo $OUTPUT->standard_head_html(); ?>
</head>

<body <?php echo $bodyattributes; ?>>
<?php echo $OUTPUT->standard_top_of_body_html(); ?>

<!-- Navigation -->
<nav class="orbit-navbar">
    <div class="navbar-container">
        <a href="<?php echo $siteurl; ?>" class="navbar-brand">
            <img src="<?php echo $OUTPUT->image_url('logo', 'theme'); ?>" alt="Orbit LMS" height="32">
        </a>
        
        <ul class="navbar-nav">
            <li><a href="<?php echo new moodle_url('/my/'); ?>" class="<?php echo $PAGE->pagetype == 'my-index' ? 'active' : ''; ?>">Dashboard</a></li>
            <li><a href="<?php echo new moodle_url('/course/'); ?>">Courses</a></li>
            <li><a href="<?php echo new moodle_url('/calendar/view.php'); ?>">Calendar</a></li>
        </ul>
        
        <div class="navbar-actions">
            <?php echo $OUTPUT->user_menu(); ?>
        </div>
    </div>
</nav>

<!-- Main Container -->
<div class="orbit-container">
    <!-- Sidebar -->
    <?php if (!empty($PAGE->blocks->get_regions()) && $PAGE->blocks->region_has_content('side-pre', $OUTPUT)): ?>
    <aside class="orbit-sidebar">
        <?php echo $OUTPUT->blocks('side-pre'); ?>
    </aside>
    <?php endif; ?>
    
    <!-- Main Content -->
    <main class="orbit-main">
        <?php
        echo $OUTPUT->course_content_header();
        echo $OUTPUT->main_content();
        echo $OUTPUT->course_content_footer();
        ?>
    </main>
</div>

<?php echo $OUTPUT->standard_end_of_body_html(); ?>
</body>
</html>
```

#### 3.3.2 Dashboard Layout

**File**: `theme/orbit/layout/dashboard.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$bodyattributes = $OUTPUT->body_attributes();
$siteurl = new moodle_url('/');

echo $OUTPUT->doctype();
?>
<html <?php echo $OUTPUT->htmlattributes(); ?>>
<head>
    <title><?php echo $OUTPUT->page_title(); ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
    
    <?php echo $OUTPUT->standard_head_html(); ?>
</head>

<body <?php echo $bodyattributes; ?>>
<?php echo $OUTPUT->standard_top_of_body_html(); ?>

<!-- Navigation -->
<nav class="orbit-navbar">
    <div class="navbar-container">
        <a href="<?php echo $siteurl; ?>" class="navbar-brand">
            <img src="<?php echo $OUTPUT->image_url('logo', 'theme'); ?>" alt="Orbit LMS">
        </a>
        
        <ul class="navbar-nav">
            <li><a href="<?php echo new moodle_url('/my/'); ?>" class="active">Dashboard</a></li>
            <li><a href="<?php echo new moodle_url('/course/'); ?>">Courses</a></li>
            <li><a href="<?php echo new moodle_url('/calendar/view.php'); ?>">Calendar</a></li>
        </ul>
        
        <div class="navbar-actions">
            <?php echo $OUTPUT->user_menu(); ?>
        </div>
    </div>
</nav>

<div class="orbit-container">
    <!-- Sidebar with quick navigation -->
    <aside class="orbit-sidebar">
        <div class="sidebar-section">
            <h6 class="section-title">My Learning</h6>
            <ul class="sidebar-menu">
                <li><a href="<?php echo new moodle_url('/my/'); ?>" class="active">📊 Overview</a></li>
                <li><a href="<?php echo new moodle_url('/my/courses.php'); ?>">📚 My Courses</a></li>
                <li><a href="<?php echo new moodle_url('/calendar/view.php'); ?>">📅 Calendar</a></li>
                <li><a href="<?php echo new moodle_url('/grade/report/overview/index.php'); ?>">🎯 Grades</a></li>
            </ul>
        </div>
        
        <div class="sidebar-section">
            <h6 class="section-title">Activity</h6>
            <ul class="sidebar-menu">
                <li><a href="<?php echo new moodle_url('/message/'); ?>">💬 Messages</a></li>
                <li><a href="<?php echo new moodle_url('/badges/mybadges.php'); ?>">🏆 Badges</a></li>
            </ul>
        </div>
    </aside>
    
    <!-- Main Dashboard Content -->
    <main class="orbit-main">
        <div class="dashboard-header mb-xl">
            <h1>Welcome back, <?php echo $USER->firstname; ?>! 👋</h1>
            <p class="text-secondary">Here's what's happening with your learning today.</p>
        </div>
        
        <!-- Dashboard Content -->
        <?php
        echo $OUTPUT->course_content_header();
        echo $OUTPUT->main_content();
        echo $OUTPUT->course_content_footer();
        ?>
    </main>
</div>

<?php echo $OUTPUT->standard_end_of_body_html(); ?>
</body>
</html>
```

#### 3.3.3 Login Page Layout

**File**: `theme/orbit/layout/login.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$bodyattributes = $OUTPUT->body_attributes();

echo $OUTPUT->doctype();
?>
<html <?php echo $OUTPUT->htmlattributes(); ?>>
<head>
    <title><?php echo $OUTPUT->page_title(); ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
    
    <?php echo $OUTPUT->standard_head_html(); ?>
    
    <style>
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg-primary);
            padding: var(--space-xl);
        }
        
        .login-box {
            max-width: 450px;
            width: 100%;
        }
        
        .login-card {
            background: var(--color-bg-surface);
            border: 1px solid var(--color-border-standard);
            border-radius: var(--radius-2xl);
            padding: var(--space-2xl);
            box-shadow: var(--shadow-xl);
        }
        
        .login-header {
            text-align: center;
            margin-bottom: var(--space-xl);
        }
        
        .login-logo {
            height: 48px;
            margin-bottom: var(--space-lg);
        }
        
        .login-header h2 {
            margin-bottom: var(--space-sm);
        }
        
        .login-header p {
            color: var(--color-text-secondary);
            margin-bottom: 0;
        }
    </style>
</head>

<body <?php echo $bodyattributes; ?>>
<?php echo $OUTPUT->standard_top_of_body_html(); ?>

<div class="login-container">
    <div class="login-box">
        <div class="login-card glass-effect">
            <div class="login-header">
                <img src="<?php echo $OUTPUT->image_url('logo', 'theme'); ?>" alt="Orbit LMS" class="login-logo">
                <h2>Welcome to Orbit</h2>
                <p>Sign in to continue your learning journey</p>
            </div>
            
            <?php echo $OUTPUT->main_content(); ?>
        </div>
        
        <p class="text-center mt-lg text-secondary">
            <small>Powered by Smartslate</small>
        </p>
    </div>
</div>

<?php echo $OUTPUT->standard_end_of_body_html(); ?>
</body>
</html>
```

---

## 4. Phase 3: Core UI Components

**Duration**: 4 weeks  
**Priority**: Critical

### 4.1 Custom Renderers

Create custom renderers to override Moodle's default HTML output.

#### 4.1.1 Core Renderer

**File**: `theme/orbit/classes/output/core_renderer.php`

```php
<?php
namespace theme_orbit\output;

defined('MOODLE_INTERNAL') || die();

class core_renderer extends \theme_boost\output\core_renderer {
    
    /**
     * Custom user menu rendering
     */
    public function user_menu($user = null, $withlinks = null) {
        global $USER, $CFG, $OUTPUT;
        
        if (is_null($user)) {
            $user = $USER;
        }
        
        $userpicture = new \user_picture($user);
        $userpicture->size = 50;
        
        $html = '<div class="user-menu-container">';
        $html .= '<button class="user-menu-trigger btn-ghost" aria-expanded="false">';
        $html .= $OUTPUT->render($userpicture);
        $html .= '<span class="user-name">' . fullname($user) . '</span>';
        $html .= '<svg class="dropdown-icon" width="16" height="16" fill="currentColor"><use href="#chevron-down"/></svg>';
        $html .= '</button>';
        
        $html .= '<div class="user-menu-dropdown glass-effect">';
        $html .= '<div class="user-menu-header">';
        $html .= $OUTPUT->render($userpicture);
        $html .= '<div class="user-info">';
        $html .= '<strong>' . fullname($user) . '</strong>';
        $html .= '<small class="text-secondary">' . $user->email . '</small>';
        $html .= '</div>';
        $html .= '</div>';
        
        $html .= '<ul class="user-menu-items">';
        $html .= '<li><a href="' . new \moodle_url('/user/profile.php') . '">👤 Profile</a></li>';
        $html .= '<li><a href="' . new \moodle_url('/user/preferences.php') . '">⚙️ Preferences</a></li>';
        $html .= '<li><a href="' . new \moodle_url('/message/index.php') . '">💬 Messages</a></li>';
        $html .= '<li class="divider"></li>';
        $html .= '<li><a href="' . new \moodle_url('/login/logout.php', ['sesskey' => sesskey()]) . '">🚪 Logout</a></li>';
        $html .= '</ul>';
        $html .= '</div>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Custom course card rendering
     */
    public function course_card($course) {
        global $OUTPUT;
        
        $courseimage = \core_course\external\course_summary_exporter::get_course_image($course);
        if (!$courseimage) {
            $courseimage = $OUTPUT->get_generated_image_for_id($course->id);
        }
        
        $progress = null;
        if (isloggedin() && !isguestuser()) {
            $progress = \core_completion\progress::get_course_progress_percentage($course);
        }
        
        $html = '<div class="course-card">';
        $html .= '<img src="' . $courseimage . '" alt="' . s($course->fullname) . '" class="course-image">';
        $html .= '<h3 class="course-title">' . format_string($course->fullname) . '</h3>';
        
        if (!empty($course->summary)) {
            $html .= '<p class="course-description">' . shorten_text(format_text($course->summary), 120) . '</p>';
        }
        
        $html .= '<div class="course-meta">';
        $html .= '<span class="meta-item">👥 ' . $this->get_course_enrollment_count($course->id) . ' students</span>';
        $html .= '</div>';
        
        if ($progress !== null) {
            $html .= '<div class="course-progress">';
            $html .= '<div class="progress-bar"><div class="progress-fill" style="width: ' . $progress . '%"></div></div>';
            $html .= '<div class="progress-text">';
            $html .= '<span>Progress</span>';
            $html .= '<span><strong>' . round($progress) . '%</strong></span>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        $html .= '<a href="' . new \moodle_url('/course/view.php', ['id' => $course->id]) . '" class="btn btn-primary mt-lg">Continue Learning →</a>';
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Get course enrollment count
     */
    private function get_course_enrollment_count($courseid) {
        global $DB;
        $context = \context_course::instance($courseid);
        return count_enrolled_users($context);
    }
}
```

#### 4.1.2 Course Renderer

**File**: `theme/orbit/classes/output/core/course_renderer.php`

```php
<?php
namespace theme_orbit\output\core;

defined('MOODLE_INTERNAL') || die();

class course_renderer extends \core_course_renderer {
    
    /**
     * Renders HTML to display courses list
     */
    public function courses_list($courses) {
        global $OUTPUT;
        
        if (empty($courses)) {
            return '<div class="alert alert-info">No courses available.</div>';
        }
        
        $html = '<div class="dashboard-grid">';
        
        foreach ($courses as $course) {
            $html .= $OUTPUT->course_card($course);
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    /**
     * Renders course section
     */
    protected function course_section($course, $section, $onsectionpage, $sectionreturn = 0) {
        $html = '<div class="course-section orbit-card" id="section-' . $section->section . '">';
        
        // Section header
        $html .= '<div class="section-header">';
        $html .= '<h3 class="section-title">' . get_section_name($course, $section) . '</h3>';
        
        if (!empty($section->summary)) {
            $html .= '<div class="section-summary">' . format_text($section->summary, FORMAT_HTML) . '</div>';
        }
        
        $html .= '</div>';
        
        // Section content
        if (!empty($section->sequence)) {
            $html .= '<div class="section-content">';
            $html .= $this->course_section_cm_list($course, $section, $sectionreturn);
            $html .= '</div>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
}
```

### 4.2 Custom Mustache Templates

Moodle 4.x uses Mustache templates. Create custom templates for key components.

#### 4.2.1 Course Card Template

**File**: `theme/orbit/templates/core_course/course_card.mustache`

```mustache
{{!
    Course card template for Orbit theme
    
    Context variables:
    * fullname - Course full name
    * summary - Course summary
    * courseimage - Course image URL
    * progress - Completion percentage
    * viewurl - URL to view course
    * enrolledusers - Number of enrolled users
}}

<div class="course-card glass-effect">
    {{#courseimage}}
        <img src="{{{courseimage}}}" alt="{{fullname}}" class="course-image">
    {{/courseimage}}
    
    <div class="course-content">
        <h3 class="course-title">{{fullname}}</h3>
        
        {{#summary}}
            <p class="course-description">{{{summary}}}</p>
        {{/summary}}
        
        <div class="course-meta">
            <span class="meta-item">
                <svg width="16" height="16" class="icon"><use href="#users"/></svg>
                {{enrolledusers}} students
            </span>
        </div>
        
        {{#progress}}
            <div class="course-progress mt-md">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{progress}}%"></div>
                </div>
                <div class="progress-text">
                    <span class="text-secondary">Progress</span>
                    <span><strong>{{progress}}%</strong></span>
                </div>
            </div>
        {{/progress}}
        
        <a href="{{{viewurl}}}" class="btn btn-primary mt-lg">
            Continue Learning
            <svg width="16" height="16" class="icon ml-sm"><use href="#arrow-right"/></svg>
        </a>
    </div>
</div>
```

#### 4.2.2 Activity Card Template

**File**: `theme/orbit/templates/core/activity_card.mustache`

```mustache
{{!
    Activity card template
    
    Context variables:
    * name - Activity name
    * modname - Module name (e.g., 'quiz', 'assign')
    * url - Activity URL
    * duedate - Due date (if applicable)
    * completion - Completion status
    * icon - Activity icon
}}

<div class="activity-card orbit-card">
    <div class="activity-header">
        <div class="activity-icon {{modname}}-icon">
            {{{icon}}}
        </div>
        <div class="activity-info">
            <h4 class="activity-title">{{name}}</h4>
            <span class="activity-type text-secondary">{{modtype}}</span>
        </div>
    </div>
    
    {{#duedate}}
        <div class="activity-due mt-md">
            <svg width="16" height="16" class="icon"><use href="#clock"/></svg>
            <span class="text-secondary">Due: {{duedate}}</span>
        </div>
    {{/duedate}}
    
    <div class="activity-actions mt-lg">
        <a href="{{{url}}}" class="btn btn-secondary">
            {{#completion}}
                Review
            {{/completion}}
            {{^completion}}
                Start Activity
            {{/completion}}
        </a>
        
        {{#completion}}
            <span class="activity-status completed">
                <svg width="16" height="16" class="icon"><use href="#check-circle"/></svg>
                Completed
            </span>
        {{/completion}}
    </div>
</div>
```

### 4.3 JavaScript Enhancements

#### 4.3.1 Interactive Components

**File**: `theme/orbit/javascript/components.js`

```javascript
/**
 * Orbit LMS Interactive Components
 * Custom JavaScript for enhanced user experience
 */

(function() {
    'use strict';
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initUserMenu();
        initSidebar();
        initModals();
        initTooltips();
        initAnimations();
    });
    
    /**
     * User menu dropdown
     */
    function initUserMenu() {
        const trigger = document.querySelector('.user-menu-trigger');
        const dropdown = document.querySelector('.user-menu-dropdown');
        
        if (!trigger || !dropdown) return;
        
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', !isExpanded);
            dropdown.classList.toggle('active');
        });
        
        // Close on outside click
        document.addEventListener('click', function() {
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.classList.remove('active');
        });
    }
    
    /**
     * Mobile sidebar toggle
     */
    function initSidebar() {
        const sidebar = document.querySelector('.orbit-sidebar');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        
        if (!sidebar || !toggleBtn) return;
        
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // Close on outside click (mobile)
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Modal functionality
     */
    function initModals() {
        // Open modal
        document.querySelectorAll('[data-modal-target]').forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const modalId = this.getAttribute('data-modal-target');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    
                    // Focus first focusable element
                    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (focusable) focusable.focus();
                }
            });
        });
        
        // Close modal
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(closer => {
            closer.addEventListener('click', function() {
                const modal = this.closest('.orbit-modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.orbit-modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    /**
     * Tooltips
     */
    function initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            const tooltip = document.createElement('div');
            tooltip.className = 'orbit-tooltip';
            tooltip.textContent = element.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            element.addEventListener('mouseenter', function() {
                const rect = this.getBoundingClientRect();
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
                tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.classList.add('active');
            });
            
            element.addEventListener('mouseleave', function() {
                tooltip.classList.remove('active');
            });
        });
    }
    
    /**
     * Scroll animations
     */
    function initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.course-card, .activity-card, .orbit-card').forEach(el => {
            observer.observe(el);
        });
    }
    
    /**
     * Progress bar animations
     */
    function animateProgressBars() {
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }
    
    // Run progress animations after page load
    window.addEventListener('load', animateProgressBars);
    
})();
```

*[Continued in next section due to length...]*

---

## 5. Phase 4: Learning Experience Redesign

**Duration**: 4-5 weeks  
**Priority**: High

### 5.1 Course Page Redesign

#### 5.1.1 Custom Course Format

Create a custom course format for modern learning experience.

**File**: `course/format/orbit/format.php`

```php
<?php
namespace format_orbit;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/format/topics/lib.php');

class format extends \format_topics {
    
    /**
     * Returns the format's settings and gets them if they have not been set yet
     */
    public function course_format_options($foreditform = false) {
        $courseformatoptions = parent::course_format_options($foreditform);
        
        // Add custom format options
        $courseformatoptions['courseview'] = array(
            'default' => 'grid',
            'type' => PARAM_ALPHA,
        );
        
        $courseformatoptions['showprogress'] = array(
            'default' => 1,
            'type' => PARAM_INT,
        );
        
        return $courseformatoptions;
    }
    
    /**
     * Renders the course page
     */
    public function get_view_url($section, $options = array()) {
        $course = $this->get_course();
        $url = new \moodle_url('/course/view.php', array('id' => $course->id));
        
        if ($section !== null && $section != 0) {
            $url->param('section', $section);
        }
        
        return $url;
    }
}
```

#### 5.1.2 Course View Template

**File**: `theme/orbit/templates/format_orbit/course.mustache`

```mustache
{{!
    Modern course view template
}}

<div class="orbit-course-container">
    <!-- Course Header -->
    <div class="course-hero glass-effect-strong">
        {{#courseimage}}
            <div class="course-hero-bg" style="background-image: url({{{courseimage}}})"></div>
        {{/courseimage}}
        
        <div class="course-hero-content">
            <div class="course-breadcrumb">
                <a href="/my">Dashboard</a>
                <span class="separator">→</span>
                <a href="/course">Courses</a>
                <span class="separator">→</span>
                <span>{{coursename}}</span>
            </div>
            
            <h1 class="course-hero-title">{{coursename}}</h1>
            
            {{#coursesummary}}
                <p class="course-hero-description">{{coursesummary}}</p>
            {{/coursesummary}}
            
            <div class="course-hero-meta">
                <div class="meta-item">
                    <svg width="20" height="20"><use href="#users"/></svg>
                    <span>{{enrolledcount}} students</span>
                </div>
                
                <div class="meta-item">
                    <svg width="20" height="20"><use href="#clock"/></svg>
                    <span>{{duration}}</span>
                </div>
                
                {{#completionpercentage}}
                    <div class="meta-item">
                        <svg width="20" height="20"><use href="#chart"/></svg>
                        <span>{{completionpercentage}}% complete</span>
                    </div>
                {{/completionpercentage}}
            </div>
            
            {{#progressbar}}
                <div class="course-hero-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {{completionpercentage}}%"></div>
                    </div>
                </div>
            {{/progressbar}}
        </div>
    </div>
    
    <!-- Course Navigation Tabs -->
    <div class="course-tabs">
        <ul class="tabs-list">
            <li class="tab-item active">
                <a href="#content" class="tab-link">📚 Content</a>
            </li>
            <li class="tab-item">
                <a href="#people" class="tab-link">👥 People</a>
            </li>
            <li class="tab-item">
                <a href="#grades" class="tab-link">🎯 Grades</a>
            </li>
            <li class="tab-item">
                <a href="#resources" class="tab-link">📁 Resources</a>
            </li>
        </ul>
    </div>
    
    <!-- Course Content -->
    <div class="course-content-wrapper">
        <!-- Main Content Area -->
        <div class="course-main">
            {{#sections}}
                <div class="course-section orbit-card mb-xl" id="section-{{id}}">
                    <div class="section-header">
                        <div class="section-number">{{number}}</div>
                        <div class="section-info">
                            <h2 class="section-title">{{name}}</h2>
                            {{#summary}}
                                <p class="section-summary text-secondary">{{summary}}</p>
                            {{/summary}}
                        </div>
                        
                        {{#completioninfo}}
                            <div class="section-completion">
                                <svg width="24" height="24" class="icon"><use href="#check-circle"/></svg>
                                <span>{{completed}}/{{total}} completed</span>
                            </div>
                        {{/completioninfo}}
                    </div>
                    
                    <div class="section-activities">
                        {{#activities}}
                            {{{this}}}
                        {{/activities}}
                    </div>
                </div>
            {{/sections}}
        </div>
        
        <!-- Course Sidebar -->
        <aside class="course-sidebar">
            <!-- Quick Actions -->
            <div class="sidebar-widget orbit-card mb-lg">
                <h3 class="widget-title">Quick Actions</h3>
                <ul class="action-list">
                    <li>
                        <a href="#" class="action-item">
                            <svg width="20" height="20"><use href="#bookmark"/></svg>
                            <span>Bookmark Course</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="action-item">
                            <svg width="20" height="20"><use href="#download"/></svg>
                            <span>Download Materials</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="action-item">
                            <svg width="20" height="20"><use href="#message"/></svg>
                            <span>Ask Instructor</span>
                        </a>
                    </li>
                </ul>
            </div>
            
            <!-- Upcoming Deadlines -->
            {{#upcomingdeadlines}}
                <div class="sidebar-widget orbit-card mb-lg">
                    <h3 class="widget-title">Upcoming Deadlines</h3>
                    <ul class="deadline-list">
                        {{#deadlines}}
                            <li class="deadline-item">
                                <div class="deadline-date">
                                    <strong>{{day}}</strong>
                                    <span>{{month}}</span>
                                </div>
                                <div class="deadline-info">
                                    <strong>{{title}}</strong>
                                    <span class="text-secondary">Due {{time}}</span>
                                </div>
                            </li>
                        {{/deadlines}}
                    </ul>
                </div>
            {{/upcomingdeadlines}}
            
            <!-- Course Instructor -->
            {{#instructors}}
                <div class="sidebar-widget orbit-card">
                    <h3 class="widget-title">Instructor</h3>
                    {{#instructor}}
                        <div class="instructor-card">
                            <img src="{{picture}}" alt="{{name}}" class="instructor-avatar">
                            <div class="instructor-info">
                                <strong>{{name}}</strong>
                                <span class="text-secondary">{{role}}</span>
                            </div>
                            <a href="{{messageurl}}" class="btn btn-secondary btn-sm mt-md">
                                Send Message
                            </a>
                        </div>
                    {{/instructor}}
                </div>
            {{/instructors}}
        </aside>
    </div>
</div>

<style>
.course-hero {
    position: relative;
    padding: var(--space-4xl) var(--space-2xl);
    border-radius: var(--radius-2xl);
    margin-bottom: var(--space-2xl);
    overflow: hidden;
}

.course-hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    filter: blur(10px);
}

.course-hero-content {
    position: relative;
    z-index: 1;
    max-width: 900px;
}

.course-breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
}

.course-breadcrumb a {
    color: var(--color-text-secondary);
}

.course-breadcrumb a:hover {
    color: var(--color-primary-teal);
}

.course-hero-title {
    margin-bottom: var(--space-md);
}

.course-hero-description {
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xl);
}

.course-hero-meta {
    display: flex;
    gap: var(--space-xl);
    margin-bottom: var(--space-xl);
}

.course-hero-meta .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.course-hero-progress {
    max-width: 600px;
}

.course-tabs {
    background: var(--color-bg-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-sm);
    margin-bottom: var(--space-2xl);
}

.tabs-list {
    display: flex;
    gap: var(--space-sm);
    list-style: none;
}

.tab-link {
    display: block;
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-weight: 600;
    transition: var(--transition-fast);
}

.tab-item.active .tab-link,
.tab-link:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-primary-teal);
    text-decoration: none;
}

.course-content-wrapper {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: var(--space-2xl);
}

.course-section {
    padding: var(--space-2xl);
}

.section-header {
    display: flex;
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
}

.section-number {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary-teal), var(--color-secondary-indigo));
    border-radius: var(--radius-md);
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1.25rem;
    color: #000;
}

.section-info {
    flex: 1;
}

.section-title {
    margin-bottom: var(--space-sm);
}

.section-completion {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--color-success);
    font-size: 0.9375rem;
}

.section-activities {
    display: grid;
    gap: var(--space-md);
}

.sidebar-widget {
    padding: var(--space-lg);
}

.widget-title {
    font-size: 1rem;
    margin-bottom: var(--space-md);
}

.action-list,
.deadline-list {
    list-style: none;
}

.action-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    transition: var(--transition-fast);
}

.action-item:hover {
    background: var(--color-bg-tertiary);
    text-decoration: none;
}

.deadline-item {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-md) 0;
    border-bottom: 1px solid var(--color-border-standard);
}

.deadline-item:last-child {
    border-bottom: none;
}

.deadline-date {
    flex-shrink: 0;
    width: 50px;
    text-align: center;
}

.deadline-date strong {
    display: block;
    font-size: 1.5rem;
    color: var(--color-primary-teal);
}

.deadline-info strong {
    display: block;
    margin-bottom: var(--space-xs);
}

.instructor-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.instructor-avatar {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-full);
    margin-bottom: var(--space-md);
}

@media (max-width: 1024px) {
    .course-content-wrapper {
        grid-template-columns: 1fr;
    }
    
    .course-sidebar {
        order: -1;
    }
}
</style>
```

### 5.2 Activity Page Redesign

Create custom templates for different activity types (quiz, assignment, forum, etc.).

#### 5.2.1 Quiz Activity Template

**File**: `theme/orbit/templates/mod_quiz/view.mustache`

```mustache
{{!
    Quiz activity view - redesigned for Orbit
}}

<div class="quiz-container">
    <div class="quiz-header orbit-card glass-effect mb-xl">
        <div class="quiz-icon">
            <svg width="48" height="48"><use href="#clipboard-check"/></svg>
        </div>
        
        <div class="quiz-info">
            <span class="quiz-label text-secondary">Assessment</span>
            <h1>{{quizname}}</h1>
            
            {{#intro}}
                <div class="quiz-description mt-md">
                    {{{intro}}}
                </div>
            {{/intro}}
        </div>
    </div>
    
    <!-- Quiz Metadata -->
    <div class="quiz-meta-grid">
        {{#timelimit}}
            <div class="meta-card orbit-card">
                <svg width="24" height="24" class="icon mb-md"><use href="#clock"/></svg>
                <strong>Time Limit</strong>
                <span class="text-secondary">{{timelimit}}</span>
            </div>
        {{/timelimit}}
        
        {{#attempts}}
            <div class="meta-card orbit-card">
                <svg width="24" height="24" class="icon mb-md"><use href="#repeat"/></svg>
                <strong>Attempts</strong>
                <span class="text-secondary">{{attemptsallowed}}</span>
            </div>
        {{/attempts}}
        
        {{#passinggrade}}
            <div class="meta-card orbit-card">
                <svg width="24" height="24" class="icon mb-md"><use href="#trophy"/></svg>
                <strong>Passing Grade</strong>
                <span class="text-secondary">{{passinggrade}}%</span>
            </div>
        {{/passinggrade}}
        
        {{#duedate}}
            <div class="meta-card orbit-card">
                <svg width="24" height="24" class="icon mb-md"><use href="#calendar"/></svg>
                <strong>Due Date</strong>
                <span class="text-secondary">{{duedate}}</span>
            </div>
        {{/duedate}}
    </div>
    
    <!-- Previous Attempts -->
    {{#previousattempts}}
        <div class="quiz-attempts orbit-card mt-xl">
            <h2 class="mb-lg">Your Attempts</h2>
            
            <div class="attempts-list">
                {{#attempts}}
                    <div class="attempt-item">
                        <div class="attempt-number">
                            <span class="attempt-badge">Attempt {{number}}</span>
                            <span class="attempt-date text-secondary">{{date}}</span>
                        </div>
                        
                        <div class="attempt-score">
                            <div class="score-circle {{gradeclass}}">
                                <strong>{{grade}}%</strong>
                            </div>
                        </div>
                        
                        <div class="attempt-actions">
                            <a href="{{reviewurl}}" class="btn btn-secondary btn-sm">
                                Review Answers
                            </a>
                        </div>
                    </div>
                {{/attempts}}
            </div>
        </div>
    {{/previousattempts}}
    
    <!-- Start Quiz Button -->
    <div class="quiz-actions mt-2xl">
        {{#canstart}}
            <button type="button" class="btn btn-primary btn-lg" onclick="startQuiz()">
                {{#hasattempts}}
                    Retake Quiz
                {{/hasattempts}}
                {{^hasattempts}}
                    Start Quiz
                {{/hasattempts}}
            </button>
        {{/canstart}}
        
        {{^canstart}}
            <div class="alert alert-warning">
                {{cannotstartmessage}}
            </div>
        {{/canstart}}
    </div>
</div>

<style>
.quiz-header {
    display: flex;
    gap: var(--space-xl);
    padding: var(--space-2xl);
}

.quiz-icon {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(167, 218, 219, 0.2), rgba(79, 70, 229, 0.2));
    border-radius: var(--radius-lg);
}

.quiz-icon svg {
    color: var(--color-primary-teal);
}

.quiz-label {
    display: block;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: var(--space-sm);
}

.quiz-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
}

.meta-card {
    padding: var(--space-lg);
    text-align: center;
}

.meta-card .icon {
    color: var(--color-primary-teal);
}

.meta-card strong {
    display: block;
    margin-bottom: var(--space-xs);
}

.attempts-list {
    display: grid;
    gap: var(--space-md);
}

.attempt-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
}

.attempt-badge {
    display: inline-block;
    padding: var(--space-xs) var(--space-md);
    background: rgba(167, 218, 219, 0.1);
    border-radius: var(--radius-sm);
    color: var(--color-primary-teal);
    font-size: 0.875rem;
    font-weight: 600;
}

.score-circle {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    border: 3px solid var(--color-success);
}

.score-circle.fail {
    border-color: var(--color-error);
}

.quiz-actions {
    text-align: center;
}
</style>
```

---

*Due to length constraints, I'll continue the plan in the output file. This plan is comprehensive and covers Phases 1-8 with detailed technical implementation.*

---

## Summary of Remaining Phases

**Phase 5: Backend Customization** (3 weeks)
- Custom plugins for AI integration
- Web services API development
- Database optimizations
- Caching strategies

**Phase 6: AI Integration Preparation** (4 weeks)
- AI microservices architecture
- RAG implementation for intelligent tutoring
- Content recommendation engine
- Analytics ML models

**Phase 7: Testing & Optimization** (3 weeks)
- Performance testing
- Security audits
- Accessibility compliance
- Cross-browser testing

**Phase 8: Deployment & Documentation** (2 weeks)
- Production deployment
- Developer documentation
- Admin training
- User guides

---

## Development Timeline

**Total Duration**: 23-26 weeks (~6 months)

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Setup | 2 weeks | Week 1 | Week 2 |
| Phase 2: Theme Foundation | 4 weeks | Week 3 | Week 6 |
| Phase 3: Core UI | 4 weeks | Week 7 | Week 10 |
| Phase 4: Learning Experience | 5 weeks | Week 11 | Week 15 |
| Phase 5: Backend | 3 weeks | Week 16 | Week 18 |
| Phase 6: AI Preparation | 4 weeks | Week 19 | Week 22 |
| Phase 7: Testing | 3 weeks | Week 23 | Week 25 |
| Phase 8: Deployment | 1 week | Week 26 | Week 26 |

---

## Resource Requirements

### Development Team

- **1 Backend Developer (PHP/Moodle)** - Full-time
- **2 Frontend Developers (React/TypeScript)** - Full-time
- **1 UI/UX Designer** - Full-time (first 12 weeks), then 50%
- **1 DevOps Engineer** - 50% time
- **1 QA Engineer** - Full-time (from Week 10)
- **1 Technical Lead/Architect** - Full-time

### Infrastructure

- **Development Server**: 16GB RAM, 4 cores
- **Staging Server**: 32GB RAM, 8 cores
- **PostgreSQL Database**: 16GB RAM
- **Redis Cache**: 8GB RAM
- **CDN**: Cloudflare or similar
- **File Storage**: AWS S3 or equivalent

---

This plan provides a solid foundation for building Orbit LMS using Moodle as scaffolding while completely redesigning the frontend according to Smartslate's design system. The approach balances leveraging Moodle's robust backend with creating a modern, AI-ready learning platform.
