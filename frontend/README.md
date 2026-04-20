# Smartslate Dynamic Questionnaire System

A Next.js 15 application for generating personalized learning blueprints through AI-powered dynamic questionnaires.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0
- PostgreSQL (via Supabase)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Developer Guide](../DEVELOPER_GUIDE.md)** - Development workflow and best practices
- **[Test Coverage Report](./TEST_COVERAGE_REPORT.md)** - Testing strategy and results
- **[PRD](../prd.txt)** - Product requirements document

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + React Hook Form
- **Database**: PostgreSQL via Supabase
- **AI Integration**: Vercel AI SDK v5.0.0 with triple-fallback support
  - `ai@5.0.0` - Core AI SDK framework
  - `@ai-sdk/anthropic@1.0.0` - Claude Sonnet 4 / Opus 4
  - `ollama-ai-provider@0.15.2` - Local Ollama (Qwen3:32b)
  - `zod@3.25.76` - Schema validation
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authenticated routes
│   ├── api/               # API endpoints
│   └── blueprint/         # Blueprint viewer
├── components/            # React components
│   ├── wizard/           # Static questionnaire
│   ├── dynamic-form/     # Dynamic form system
│   └── blueprint/        # Blueprint display
├── lib/                  # Utility libraries
│   ├── services/        # Business logic
│   ├── logging/         # Logging system
│   └── validation/      # Zod schemas
└── tests/               # Test files
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test -- --coverage  # With coverage

# Linting
npm run lint         # Run ESLint
```

### Environment Variables

Required environment variables:

```bash
# ========================================
# Supabase Configuration
# ========================================
# Get these from your Supabase project dashboard at https://app.supabase.com

# Public Supabase URL (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Public anonymous key (safe to expose to client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (NEVER expose to client - server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ========================================
# Supabase MCP Server Configuration
# ========================================
# These are required for the official Supabase MCP server integration

# Supabase Access Token (for Management API)
# Generate at: https://app.supabase.com/account/tokens
SUPABASE_ACCESS_TOKEN=your-access-token-here

# Project Reference ID (visible in project URL)
SUPABASE_PROJECT_REF=your-project-ref

# Database Password (from your project settings)
SUPABASE_DB_PASSWORD=your-database-password

# Optional: AWS Region where your Supabase project is hosted
# Examples: us-east-1, us-west-1, eu-west-1, ap-southeast-1
SUPABASE_REGION=us-east-1

# ========================================
# AI Providers (Vercel AI SDK v5.0.0)
# ========================================
# Required: Anthropic API Key for Claude models
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key

# Required: Ollama Base URL for local fallback
# Default: http://localhost:11434
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Enable AI SDK (default: false for gradual rollout)
NEXT_PUBLIC_USE_AI_SDK=false

# Optional: AI SDK Configuration
AI_SDK_LOG_LEVEL=info
AI_SDK_TIMEOUT_MS=60000
AI_SDK_MAX_RETRIES=3

# Legacy AI API Keys (for backward compatibility)
PERPLEXITY_API_KEY=your-perplexity-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
XAI_API_KEY=your-xai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
MISTRAL_API_KEY=your-mistral-api-key

# ========================================
# Optional Configuration
# ========================================
NEXT_PUBLIC_LOG_LEVEL=info
```

### Supabase MCP Server Setup

The official Supabase MCP server has been integrated into `.cursor/mcp.json`. To use it:

1. **Generate a Supabase Access Token**:
   - Go to https://app.supabase.com/account/tokens
   - Click "Generate new token"
   - Give it a descriptive name (e.g., "MCP Server")
   - Copy the token

2. **Update `.cursor/mcp.json`**:
   - Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your actual anon key
   - Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE` with your service role key
   - Replace `YOUR_SUPABASE_ACCESS_TOKEN_HERE` with your newly generated access token

3. **Restart Cursor** to load the new MCP server configuration

4. **Available MCP Capabilities**:
   - Create and manage Supabase projects
   - Design and modify database tables
   - Query data using natural language
   - Manage RLS policies and configurations
   - View project metrics and logs

**Security Note**: The MCP server has full access to your Supabase project. Use read-only mode when possible and always review AI-suggested changes before executing them.

## 🧪 Testing

### Test Coverage

**Overall**: 90.4% (539/596 tests passing)

- ✅ Unit Tests: 90.4%
- ✅ Integration Tests: 88.5%
- ✅ Component Tests: 96.4%

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/api/logs.test.ts

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

See [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) for detailed coverage information.

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Configuration

1. Add all environment variables in Vercel dashboard
2. Configure domains in Vercel project settings
3. Set up Supabase connection pooling for production
4. Enable Vercel Analytics (optional)

### Database Migrations

```bash
# Apply migrations
cd ../supabase
supabase db push

# Or using database URL
supabase migration up --db-url $DATABASE_URL
```

## 🎯 Key Features

### Dynamic Question Generation

- AI-powered question generation using Perplexity
- Fallback to Ollama for offline/cost optimization
- 27+ input types supported
- Section-based navigation

### Blueprint Generation

- Claude Sonnet 4 for cost-effective generation
- Claude Opus 4 fallback for complex scenarios
- JSON-based flexible schema
- Markdown export

### Offline Support

- Automatic offline detection
- Request queueing with retry
- Visual offline indicators
- Background sync when online

### Logging & Monitoring

- Structured logging system
- Client-side error tracking
- Admin logs API with filtering
- PII redaction built-in

## 🔐 Security

- ✅ Row-Level Security (RLS) via Supabase
- ✅ API authentication required
- ✅ PII redaction in logs
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ✅ Input validation with Zod

## ♿ Accessibility

- ✅ WCAG AA compliant
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Touch targets (44px minimum)
- ✅ High contrast mode
- ✅ Motion preferences respected

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome)

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and add tests
3. Run tests: `npm run test`
4. Lint code: `npm run lint`
5. Commit: `git commit -m "feat: add new feature"`
6. Push and create PR

### Commit Message Format

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `style:` - Formatting
- `chore:` - Maintenance

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to Supabase**

```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Verify Supabase project is active
# Check network connectivity
```

**Tests failing**

```bash
# Clear cache
rm -rf .next node_modules
npm install

# Run tests in isolation
npm run test -- --no-threads
```

**Build errors**

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

See [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) for more troubleshooting help.

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: ~250KB (gzipped)

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Anthropic for Claude AI
- Perplexity for research-based AI
- Supabase for backend infrastructure
- Vercel for hosting platform

## 📞 Support

- **Documentation**: Check the docs folder
- **Issues**: GitHub Issues
- **Email**: [Your Support Email]

## 🗺️ Roadmap

- [ ] E2E test implementation (Playwright)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Collaborative blueprint editing
- [ ] Mobile app (React Native)

---

**Built with ❤️ using Next.js 15**

_Last Updated: 2025-01-06_
