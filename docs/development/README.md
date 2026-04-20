# Development Documentation

This directory contains development guides, implementation summaries, best practices, and patterns for Polaris v3.

## Contents

### Implementation Summaries
- `IMPLEMENTATION_*.md` - Various feature implementation summaries
- `COST_TRACKING_IMPLEMENTATION.md` - Cost tracking system implementation
- `SOFT_DELETE_IMPLEMENTATION.md` - Soft delete pattern implementation
- `TASK_*.md` - Task-specific implementation details

### Testing
- `TEST_*.md` - Test suite analysis and execution reports
- Testing strategies and coverage reports
- Test implementation guides

### Development Best Practices
- `SMARTSLATE_BEST_PRACTICES.md` - SmartSlate-specific development patterns
- `recommended-workflow-corrected-section.md` - Recommended development workflows
- `BUILD_VERIFICATION.md` - Build verification procedures

### API Documentation
- `api-documentation.md` - API endpoint documentation and patterns

## Development Guidelines

### Code Quality Standards
1. **TypeScript Strict Mode** - All code must pass strict type checking
2. **Test Coverage** - Maintain 85%+ test coverage for critical paths
3. **Code Review** - All changes require review before merging
4. **Documentation** - Update docs alongside code changes

### Architecture Patterns
- Server Components by default (Next.js 15)
- Client components only when necessary (state, browser APIs, events)
- Zustand for client state management
- TanStack Query for server state
- Zod for validation
- Supabase for database with RLS

### Testing Strategy
- **Unit Tests**: Pure functions, utilities, type guards (95%+ coverage)
- **Integration Tests**: API routes, database operations (85%+ coverage)
- **Component Tests**: UI components with React Testing Library
- **E2E Tests**: Critical user flows

### Workflow
1. Check task in Task Master (`task-master next`)
2. Create feature branch from `main`
3. Implement with tests
4. Run linting and type checking
5. Create PR with detailed description
6. Address review feedback
7. Merge after approval

## Related Documentation

- [Architecture Documentation](../architecture/) - System design and patterns
- [Features](../features/) - Feature-specific implementation details
- [Troubleshooting](../troubleshooting/) - Common issues and solutions
- [Guides](../guides/) - Setup and migration guides

## Tools & Scripts

- `npm run dev` - Start development server
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint with auto-fix
- `npm run test` - Run test suite
- `task-master` - Task management CLI

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Claude Code integration guide
- [README.md](../../README.md) - Project README
- `.cursor/rules/` - Cursor IDE development rules
