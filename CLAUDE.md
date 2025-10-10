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
- **IMPORTANT**: This is a monorepo - NEVER use `cd` to navigate into packages. Always use `pnpm --filter <package-name> <command>` to run commands in specific packages
- Package names: `@repo/api`, `@repo/db`, `@repo/trpc`, `@repo/auth`, `@repo/ui`, `@repo/validators`

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

### OpenAPI Documentation Generation

The project uses an automated flow to generate API documentation from Zod schemas:

**1. Schema Definition** (`packages/validators/`)
- Validation schemas are built using Zod and `@hono/zod-openapi`
- Schemas include both tRPC input validation and OpenAPI specification metadata
- Uses `drizzle-zod` to generate schemas from database tables
- Example: `ticketListRequestQuery` with OpenAPI descriptions and examples

**2. Route Integration** (`apps/api/src/routes/`)
- OpenAPI routes use `createRoute()` from `@hono/zod-openapi`
- Routes reference validator schemas for request/response definitions
- Routes are registered with the main OpenAPI Hono instance

**3. Document Export** (`apps/api/src/lib/docs.ts`)
- Exports the complete OpenAPI 3.1 document using `openapi.getOpenAPI31Document()`
- Document is typed as `OpenAPIV3_1.Document` for type safety

**4. Documentation Generation** (`apps/docs/`)
- Script at `apps/docs/scripts/generate-docs.ts` imports the OpenAPI document
- Saves the document as `openapi.json` in the docs app
- Uses `fumadocs-openapi` to generate MDX files for each API operation
- Generated files are placed in `content/docs/api/` with proper metadata
- Fumadocs renders these as interactive API documentation

**Commands:**
- `pnpm --filter docs generate:docs` - Generate API documentation from OpenAPI spec

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

# Code style instructions

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
- Avoid type assertion

# Adding New API Endpoints

## Step-by-Step Process

When adding new endpoints (e.g., "add a new endpoint for updating tickets"), follow this exact process:

### 1. Create Request/Response Schemas (`@repo/validators` package)

**Location**: `packages/validators/src/{module}/`

**Steps**:
- Create schema files in organized directory structure (e.g., `tickets/`, `customers/`)
- **Input schema**: Define request parameters/body validation using `@hono/zod-openapi`
- **Output schema**: Use `createSelectSchema` from `schema-factory.ts` for DB-backed responses
- **Export**: Add to module's `index.ts` file

**Example structure**:
```
packages/validators/src/tickets/
├── index.ts          # Export all schemas
├── schema.ts         # Base ticket schema from DB
├── get.ts           # GET /{id} path parameters
├── list.ts          # GET / query parameters
├── create.ts        # POST request body
└── update.ts        # PUT/PATCH request body
```

**Key considerations**:
- Use `z.coerce.number()` for query parameters that should be numbers
- Use `z.string().transform()` for complex query parameters (JSON, CSV)
- Include OpenAPI metadata with `.openapi()` for documentation
- Ensure tRPC and OpenAPI schemas are compatible

### 2. Create tRPC Route (`@repo/trpc` package)

**Location**: `packages/trpc/src/router/{module}.ts`

**Steps**:
- Add procedure to router using `protectedProcedure` (or `publicProcedure` if public)
- Use input schema for validation
- Use output schema for response validation
- Implement business logic with RLS-enabled database queries
- Handle errors with appropriate `TRPCError` codes

**Template**:
```typescript
export const {module}Router = router({
  {action}: protectedProcedure
    .input({inputSchema})
    .output({outputSchema})
    .{type}(async ({ ctx, input }) => {
      // Business logic with RLS
      const result = await ctx.db.rls((tx) =>
        tx.query.{table}.{operation}({ /* query */ })
      );

      // Error handling
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }

      return result;
    }),
});
```

**Add comprehensive tests**:
- **Location**: `packages/trpc/tests/{module}.test.ts`
- Test successful operations
- Test error cases (not found, validation failures)
- Test organization isolation (RLS)
- Test input/output validation
- Test authentication requirements

### 3. Create OpenAPI Route (`api` package)

**Location**: `apps/api/src/routes/{module}.ts`

**Steps**:
- Create route using `createRoute()` from `@hono/zod-openapi`
- Configure request validation (query, params, body)
- Configure response schemas
- Add OpenAPI metadata (title, summary, tags, examples)
- Implement handler that delegates to tRPC caller

**Template**:
```typescript
{module}.openapi(
  createRoute({
    method: "{method}",
    title: "{Human Readable Title}",
    summary: "{Short description}",
    operationId: "{uniqueOperationId}",
    path: "/{path}",
    tags: ["{module}"],
    request: {
      query: {querySchema},      // For GET query params
      params: {paramsSchema},    // For path parameters
      body: {bodySchema},        // For POST/PUT bodies
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {responseSchema},
          },
        },
        description: "{Response description}",
      },
    },
  }),
  async (c) => {
    const caller = createTrpcCaller({ headers: c.req.raw.headers });
    const data = c.req.valid("query" | "params" | "json");
    const result = await caller.{module}.{action}(data);
    return c.json(result);
  }
);
```

**Add comprehensive tests**:
- **Location**: `apps/api/tests/{module}.test.ts`
- Test HTTP status codes (200, 404, 500, 401)
- Test request/response body validation
- Test authentication requirements
- Test error handling
- Test query parameter parsing
- Test response schema structure

### 4. Integration Steps

**Update exports**:
- Add new schemas to `packages/validators/src/index.ts`
- Add new router to `packages/trpc/src/router/index.ts`
- Add new routes to `apps/api/src/index.ts`

**Update documentation**:
- Run `pnpm --filter docs generate:docs` to update OpenAPI docs
- Ensure OpenAPI schema is properly exported from `apps/api/src/lib/docs.ts`

### 5. Quality Assurance

**Run tests**:
```bash
pnpm --filter @repo/trpc test        # tRPC tests
pnpm test --filter api               # API tests
```

**Type checking**:
```bash
pnpm --filter @repo/trpc typecheck   # tRPC package
pnpm --filter api typecheck          # API package
```

**Integration testing**:
- Test end-to-end via OpenAPI routes
- Verify tRPC and API responses are identical
- Test error scenarios across both layers

### 6. Best Practices Checklist

**Security**:
- ✅ Use `protectedProcedure` for authenticated endpoints
- ✅ Implement RLS with `ctx.db.rls()` for data isolation
- ✅ Validate all inputs with Zod schemas
- ✅ Use appropriate tRPC error codes

**Performance**:
- ✅ Use database indexes for query parameters
- ✅ Implement pagination for list endpoints
- ✅ Consider caching for frequently accessed data

**Maintainability**:
- ✅ Organize schemas by module/domain
- ✅ Use consistent naming conventions
- ✅ Add comprehensive test coverage
- ✅ Include OpenAPI documentation metadata

**Compatibility**:
- ✅ Ensure tRPC and OpenAPI schemas match
- ✅ Use `c.req.valid()` to get validated OpenAPI data
- ✅ Handle query parameter coercion properly

## Common Endpoint Types

**GET /{resource}** - List resources with pagination/filtering
**GET /{resource}/{id}** - Get single resource by ID
**POST /{resource}** - Create new resource
**PUT /{resource}/{id}** - Update entire resource
**PATCH /{resource}/{id}** - Partial update of resource
**DELETE /{resource}/{id}** - Delete resource

# Important Instructions for AI Assistants

- ALWAYS use the GitHub MCP server (mcp__github__*) when inspecting GitHub URLs instead of WebFetch or gh CLI.
