# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**Satellite CX** is an open source customer support ticketing system being built as a modern, self-hosted alternative to platforms like Zendesk. The project is in early development stages.

### What We're Building

- **Customer Support Platform**: Multi-tenant ticketing system for organizations
- **Core Features**: Ticket management, customer profiles, team collaboration, tags/priorities, audit trails
- **Target Users**: Companies wanting self-hosted customer support with developer-friendly APIs
- **Key Differentiators**: Modern tech stack, full data ownership, extensive customization capabilities

### Business Domain

- **Organizations**: Multi-tenant SaaS model where each organization has isolated data
- **Tickets**: Core entity representing customer support requests with status, priority, assignment
- **Customers**: End users who create support tickets
- **Members**: Organization users (agents, admins) who handle tickets
- **Teams**: Groups within organizations for ticket assignment and collaboration
- **Comments**: Communication thread on tickets (public/private)
- **Attachments**: File uploads on tickets and comments
- **Audit Trail**: Complete change tracking for compliance and debugging

## Commands

### Development

- `pnpm dev` - Start development servers for all apps
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm typecheck` - Type check all packages
- `pnpm test` - Run tests across workspace
- `pnpm format` - Format code with Prettier

### Database

- `pnpm db:up` - Start PostgreSQL in Docker
- `pnpm db:down` - Stop PostgreSQL container
- `pnpm db:reset` - Reset database (stops, starts, applies schema)
- `pnpm db:push` - Push database schema changes

### Package Management

- Uses pnpm workspaces with Node.js 24+ requirement
- All internal packages are under `@repo/*` namespace

## Architecture

### Monorepo Structure

- **apps/api**: Hono-based API server with tRPC integration
- **packages/db**: Drizzle ORM with PostgreSQL, includes schema and client
- **packages/trpc**: tRPC router and context configuration
- **packages/auth**: Better-auth authentication setup
- **packages/ui**: UI components (likely React-based)
- **packages/validators**: Shared validation schemas
- **tooling/**: ESLint and TypeScript configurations

### Technology Stack

- **Turborepo**: Turborepo as the build system for monorepo management
- **Runtime**: Bun for API server, Node.js for tooling
- **API**: Hono web framework with tRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better-auth with session management
- **Build**: Turborepo for monorepo orchestration
- **Linting**: ESLint with TypeScript support

### Key Database Schema

The database implements a multi-tenant architecture with organization-based isolation:

**Core Entities:**

- `organizations` - Tenant isolation boundary
- `users` - System users (agents, admins)
- `members` - Links users to organizations with roles
- `customers` - End users who submit tickets
- `tickets` - Support requests with status, priority, assignments
- `comments` - Communication threads (public/private)
- `attachments` - File uploads
- `tags` - Categorization and labeling
- `teams` - Organization sub-groups for collaboration

**Security & Compliance:**

- Row Level Security (RLS) enforces organization data isolation
- `ticket_audits` tracks all changes for compliance
- Session-based authentication with Better-auth
- API key support for integrations

### API Structure

- Main API entry at `apps/api/src/index.ts`
- Authentication endpoints at `/api/auth/*` (Better-auth)
- tRPC endpoints at `/trpc/*` (type-safe API procedures)
- Health check at `/health`
- Session validation at `/session`

**tRPC Organization**: APIs are organized around business domains:

- Organization management and member invitations
- Ticket lifecycle (create, update, assign, close)
- Customer management and profiles
- Team management and assignments
- Comment and attachment handling
- Reporting and analytics

### Database Development

- Uses Drizzle Kit for migrations: `pnpm --filter @repo/db generate`
- RLS policies applied automatically via custom scripts
- Database studio available: `pnpm --filter @repo/db dev`

## Development Notes

### Important Context for AI Assistants

When working on this codebase, remember:

- **Multi-tenant architecture**: All data operations must respect organization boundaries
- **RLS is critical**: Database queries are protected by Row Level Security policies
- **Type safety**: Use tRPC for all API development to maintain type safety
- **Test-driven**: Write tests for new features, especially around data isolation
- **Early stage**: APIs and schemas may change rapidly during development

### Environment Setup

- Requires `.env` file in project root
- Database connection via `POSTGRES_*` environment variables
- API runs on port 8000 by default
- Uses Volta for Node.js version management (pinned to v24.9.0)
- pnpm is configured to use the correct Node.js version through Volta

### Common Development Patterns

- Use `createDrizzleClient({ organizationId, userId, role })` for RLS-enabled queries
- All ticket operations should include organization context
- Customer data must be isolated per organization
- Audit trails should be created for significant data changes

## Code style instructions

- Use meaningful names – no `data` or `obj`.
- Keep functions small – do one thing only.
- Avoid nesting – prefer early returns over deep `if/else`.
- No magic values – use constants, enums, or literal types.
- Avoid comments – code should explain itself
- Prefer pure functions – avoid hidden side effects.
- Favor immutability – use `const`, `readonly`, avoid mutation.
- Don’t use `any` – use real types or generics.
- Delete dead code – no commented-out leftovers.
- Keep tests clean – readable, fast, and documenting behavior.
- Do not use `switch` statements.
