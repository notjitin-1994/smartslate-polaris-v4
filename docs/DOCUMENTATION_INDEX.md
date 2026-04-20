# Documentation Index

Welcome to the Polaris v3 documentation. This index provides a comprehensive overview of all documentation organized by category.

## Quick Start

- [START-HERE.txt](START-HERE.txt) - Begin here for project overview
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [EXECUTIVE-BRIEF.md](EXECUTIVE-BRIEF.md) - Executive summary
- [README.md](README.md) - Main documentation README

## 📁 Core Documentation Directories

### [Architecture](architecture/)
System architecture, design patterns, and structural documentation.
- Application flow and data flow diagrams
- Code structure and organization
- Style guide and design system
- Tier display naming conventions

### [Features](features/)
Feature-specific documentation organized by domain.
- **[Admin](features/admin/)** - Admin dashboard, monitoring, user management
- **[Auth](features/auth/)** - Authentication, roles, subscriptions
- **[Limits](features/limits/)** - Usage limits, tier management
- **[Logging](features/logging/)** - Logging system
- **[Notifications](features/notifications/)** - Notification system
- **[Payments](features/payments/)** - Razorpay integration, checkout
- **[UI](features/ui/)** - UI features, mobile responsiveness, components

### [Development](development/)
Development guides, best practices, and implementation summaries.
- Implementation summaries
- Testing documentation
- API documentation
- SmartSlate best practices
- Build verification

### [Guides](guides/)
Step-by-step implementation and migration guides.
- Database migration procedures
- Data backfill instructions
- MCP configuration guides
- Supabase integration

### [Troubleshooting](troubleshooting/)
Bug fixes, issue resolution, and troubleshooting guides.
- Blueprint counting fixes
- Counter and usage display issues
- Email troubleshooting
- Static wizard error handling

### [Operations](operations/)
Operational procedures, monitoring, and deployment.
- Performance monitoring
- Deployment procedures
- Emergency procedures and rollback
- Post-launch monitoring plans

### [Security](security/)
Security audits, fixes, and best practices.
- Security audit reports
- Security fix summaries

### [Setup](setup/)
Initial project setup and configuration.
- Installation guides
- Production setup
- MCP and Redis configuration
- **[Production](setup/production/)** - Production deployment guides

### [Marketing](marketing/)
Marketing copy, feature analysis, and positioning.
- Marketing accuracy findings
- Polaris feature analysis
- Learning professionals features

### [Product](product/)
Product documentation and roadmap.
- Feature specifications
- Product roadmap

### [PRDs](prds/)
Product Requirements Documents for major features.
- Main PRD
- Razorpay payment integration
- User roles and subscriptions
- Vercel AI SDK migration
- Orbit-Moodle scaffold plan

### [Prompts](prompts/)
AI prompts and system prompts.
- Dynamic question generation prompts
- Claude AI prompts
- Task Master prompts

## 📱 Frontend Documentation

Located in [`frontend/docs/`](../frontend/docs/)

### Organization
- **[Features](../frontend/docs/features/)** - Frontend feature implementations
- **[Testing](../frontend/docs/testing/)** - Test coverage and execution reports
- **[Guides](../frontend/docs/guides/)** - Frontend-specific guides
- **[Troubleshooting](../frontend/docs/troubleshooting/)** - Frontend bug fixes

### Key Frontend Files
- [`API_DOCUMENTATION.md`](../frontend/docs/API_DOCUMENTATION.md) - API routes
- [`CODE_STRUCTURE.md`](../frontend/docs/CODE_STRUCTURE.md) - Frontend structure
- [`PERFORMANCE_OPTIMIZATION_SUMMARY.md`](../frontend/docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md) - Performance guide

## 📊 High-Level Summaries

### Executive & Analysis
- [EXECUTIVE-BRIEF.md](EXECUTIVE-BRIEF.md) - Executive brief
- [DELIVERABLES-SUMMARY.md](DELIVERABLES-SUMMARY.md) - Project deliverables
- [ANALYSIS-INDEX.md](ANALYSIS-INDEX.md) - Analysis documentation index
- [FEATURES_SUMMARY.txt](FEATURES_SUMMARY.txt) - Features summary

### Project Status
- [README.md](README.md) - Project overview and status

## 🔧 Development Resources

### For Developers
- [Development](development/) - Development guides and best practices
- [Architecture](architecture/) - System design and patterns
- [Features](features/) - Feature implementation details
- [Troubleshooting](troubleshooting/) - Common issues and solutions

### For Operations
- [Operations](operations/) - Deployment and monitoring
- [Setup](setup/) - Configuration and installation
- [Security](security/) - Security guidelines

### For Product
- [PRDs](prds/) - Product requirements
- [Product](product/) - Product documentation
- [Marketing](marketing/) - Marketing materials

## 🎯 Common Tasks

### Setting Up the Project
1. Read [QUICK_START.md](QUICK_START.md)
2. Follow [Setup > Installation](setup/installation.md)
3. Configure environment per [Setup](setup/)

### Implementing a Feature
1. Read relevant [PRD](prds/)
2. Review [Architecture](architecture/) patterns
3. Check [Features](features/) for related implementations
4. Follow [Development](development/) best practices

### Deploying to Production
1. Review [Operations > Deployment](operations/deployment.md)
2. Check [Setup > Production](setup/production/)
3. Follow [Operations > Monitoring](operations/)

### Troubleshooting Issues
1. Check [Troubleshooting](troubleshooting/) for known issues
2. Review [Operations > Emergency Procedures](operations/ROLLBACK_AND_EMERGENCY_PROCEDURES.md)
3. Consult [Guides](guides/) for migrations

## 📚 Additional Resources

### Project Root Documentation
- [CLAUDE.md](../CLAUDE.md) - Claude Code integration guide
- [README.md](../README.md) - Project README
- [.cursor/rules/](../.cursor/rules/) - Cursor IDE development rules
- [.taskmaster/](../.taskmaster/) - Task Master AI integration

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

## 🔍 Finding Documentation

### By Topic
- **Authentication**: [Features > Auth](features/auth/)
- **Payments**: [Features > Payments](features/payments/)
- **Admin Dashboard**: [Features > Admin](features/admin/)
- **UI Components**: [Features > UI](features/ui/)
- **Database**: [Guides](guides/) and [Architecture](architecture/)
- **Testing**: [Development](development/) and [Frontend > Testing](../frontend/docs/testing/)
- **Deployment**: [Operations](operations/) and [Setup > Production](setup/production/)

### By Role
- **Developers**: Start with [Development](development/)
- **DevOps**: Start with [Operations](operations/)
- **Product**: Start with [PRDs](prds/)
- **Designers**: Start with [Architecture > Style Guide](architecture/styleguide-final.md)

## 📝 Documentation Standards

### File Naming
- Use descriptive, kebab-case names
- Group related docs with common prefixes
- Use .md for markdown, .txt for plain text

### Organization
- Place docs in the most specific relevant directory
- Use README.md in each directory for navigation
- Cross-reference related documentation

### Writing Style
- Start with executive summary
- Use clear headings and sections
- Include code examples where relevant
- Link to related documentation
- Keep language concise and actionable

---

Last Updated: 2025-11-19
