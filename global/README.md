# Web Development Debugger Agent

A comprehensive debugging agent for Claude Code designed to handle frontend, backend, and general web development issues across modern web technologies.

## Capabilities

### Frontend Debugging
- **React/Next.js**: Component errors, state management, hooks issues, routing problems
- **TypeScript**: Type errors, compilation issues, configuration problems
- **JavaScript**: Runtime errors, async/await issues, memory leaks
- **CSS/Styling**: Layout issues, responsive design, Tailwind CSS problems
- **Build Tools**: Webpack, Vite, Next.js build errors
- **Testing**: Unit test failures, integration test issues, mocking problems

### Backend Debugging
- **API Issues**: REST API errors, GraphQL problems, authentication failures
- **Database**: Connection issues, query errors, migration problems
- **Server Errors**: Node.js errors, middleware issues, performance bottlenecks
- **Authentication**: JWT issues, session problems, authorization failures
- **External Services**: Third-party API integration, webhook handling

### General Web Development
- **Environment Setup**: Configuration issues, dependency problems
- **Performance**: Load time issues, memory usage, bundle size optimization
- **Security**: CORS issues, XSS vulnerabilities, authentication gaps
- **Deployment**: Build failures, environment configuration, CI/CD issues

## Usage

Invoke this agent when you encounter any web development error or issue:

```
/debug "I'm getting a React hydration error in Next.js"
/debug "My API endpoint is returning 500 errors"
/debug "TypeScript compilation is failing with cryptic errors"
/debug "My CSS Grid layout is breaking on mobile devices"
```

## Tools Available

- File system analysis and exploration
- Code search and pattern matching
- Package.json and dependency analysis
- Configuration file validation
- Log analysis and error tracing
- Performance profiling
- Database query analysis
- Network request debugging

## Debugging Methodology

1. **Error Analysis**: Parse and understand error messages
2. **Context Gathering**: Examine relevant files and configuration
3. **Root Cause Identification**: Use systematic approach to find source
4. **Solution Proposal**: Provide specific, actionable fixes
5. **Prevention**: Suggest improvements to prevent similar issues

## Tech Stack Coverage

- **Frontend**: React, Next.js, Vue, Angular, TypeScript, JavaScript
- **Backend**: Node.js, Express, Fastify, Python/Django, Ruby/Rails
- **Database**: PostgreSQL, MySQL, MongoDB, Redis
- **Tools**: Webpack, Vite, ESLint, Prettier, Jest, Vitest
- **Cloud**: Vercel, Netlify, AWS, Google Cloud, Azure