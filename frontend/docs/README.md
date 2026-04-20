# Frontend Documentation

This directory contains frontend-specific documentation for the Polaris v3 Next.js application.

## Directory Structure

### `/features` - Feature Implementation

Documentation for frontend feature implementations:

- Login page customization and marketing
- Razorpay payment modal setup
- Share page implementation
- Feature-specific UI components

### `/testing` - Test Documentation

Test coverage reports, execution summaries, and testing guides:

- Test execution reports
- Coverage summaries
- Testing strategies

### `/guides` - Frontend Guides

Implementation guides for frontend systems:

- Redis setup and configuration
- API usage examples

### `/troubleshooting` - Frontend Issues

Frontend-specific bug fixes and troubleshooting:

- Currency display fixes
- Edit section fixes
- Mobile/tablet responsive fixes
- Sidebar fixes

### Root Level Files

#### Core Documentation

- `API_DOCUMENTATION.md` - Frontend API routes and usage
- `CODE_STRUCTURE.md` - Frontend codebase structure
- `README.md` - Frontend overview (this file)

#### Performance

- `PERFORMANCE_OPTIMIZATION_SUMMARY.md` - Performance optimization guide
- `LOAD_TESTING_GUIDE.md` - Load testing procedures
- `scrollbar-styling.md` - Custom scrollbar implementation

#### Features

- `feedback-system-implementation-status.md` - Feedback system status
- `pricing.md` - Pricing page documentation

#### Testing & Quality

- `ACTIVITY_LOGS_BACKFILL.md` - Activity logs backfill procedures
- `RAZORPAY_PRODUCTION_CHECKLIST.md` - Razorpay production checklist
- `RAZORPAY_TESTING.md` - Razorpay testing guide

## Tech Stack

### Core Framework

- **Next.js 15** - App Router, Server Components, React 19
- **TypeScript 5.7** - Strict mode enabled
- **React 19** - Latest features and patterns

### Styling

- **Tailwind CSS v4** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations (client-side only)

### State Management

- **Zustand** - Client state management
- **TanStack Query** - Server state and caching
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Backend Integration

- **Supabase** - PostgreSQL database with RLS
- **Anthropic Claude** - AI blueprint generation
- **Razorpay** - Payment processing

## Development

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

### Key Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run typecheck        # TypeScript checking
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
npm run test             # Run tests with Vitest
npm run test:watch       # Watch mode
```

### Directory Structure

```
frontend/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authenticated routes
│   ├── (public)/       # Public routes
│   ├── api/            # API routes
│   └── ...
├── components/          # React components
│   ├── ui/             # Base UI components (Radix)
│   ├── features/       # Feature-specific components
│   └── shared/         # Shared components
├── lib/                # Utilities and shared code
│   ├── supabase/       # Supabase clients
│   ├── stores/         # Zustand stores
│   └── utils/          # Helper functions
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## Related Documentation

- [Root Documentation](../../docs/) - Project-wide documentation
- [Architecture](../../docs/architecture/) - System architecture
- [Features](../../docs/features/) - Feature documentation
- [CLAUDE.md](../../CLAUDE.md) - Claude Code integration

## Quick Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- [Radix UI](https://www.radix-ui.com)
