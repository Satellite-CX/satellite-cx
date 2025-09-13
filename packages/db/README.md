# @repo/db

Database package for SCX using Drizzle ORM and PostgreSQL.

## Schema Overview

This package contains the database schema for a basic customer support platform with the following entities:

- **Users**: Customers, agents, and admins
- **Organizations**: Customer organizations/companies
- **Tickets**: Support tickets with status, priority, and assignments
- **Comments**: Ticket comments (public and internal notes)

## Scripts

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:push` - Push schema changes directly to database (dev only)
- `pnpm db:studio` - Open Drizzle Studio for database exploration

## Environment Variables

Set `DATABASE_URL` in your environment:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/satellite_cx"
```
