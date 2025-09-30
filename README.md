# Satellite CX

> **⚠️ Early Development**: This project is in early stages and not ready for production use. We welcome early feedback and contributions!

An open source customer support ticketing system built for modern teams. Satellite CX aims to provide a powerful, self-hosted alternative to platforms like Zendesk, with a focus on developer experience and customization.

## 🚀 Vision

We're building a customer support platform that prioritizes:

- **Developer-friendly**: Built with modern web technologies and clear APIs
- **Self-hosted**: Full control over your data and customizations
- **Open source**: Transparent, community-driven development
- **Scalable**: Designed to grow with your team and customer base

## 🛠️ Tech Stack

- **Runtime**: Bun + Node.js with Volta for version management
- **Backend**: Hono web framework with tRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM and Row Level Security (RLS)
- **Auth**: Better-auth for flexible authentication
- **Build System**: Turborepo monorepo with pnpm workspaces
- **Testing**: Bun test runner

## 📋 Current Features (In Development)

- 🎫 **Ticket Management**: Create, update, and track customer support tickets
- 👥 **Organization Management**: Multi-tenant architecture with organization isolation
- 🏷️ **Tags & Categories**: Organize tickets with custom tags and priorities
- 💬 **Comments**: Internal and public commenting system
- 📎 **Attachments**: File attachment support for tickets
- 🔐 **Row Level Security**: Database-level security for multi-tenant data isolation
- 📊 **Audit Trail**: Track all changes to tickets and customer data

## 🏗️ Project Structure

This is a monorepo with the following packages:

```
├── apps/
│   └── api/          # Hono API server with tRPC
├── packages/
│   ├── db/           # Drizzle schema, migrations, and utilities
│   ├── trpc/         # tRPC router and procedures
│   ├── auth/         # Better-auth configuration
│   ├── ui/           # Shared UI components
│   └── validators/   # Shared validation schemas
└── tooling/          # ESLint and TypeScript configurations
```

## 🚦 Getting Started

### Prerequisites

- Node.js 24+ (managed with Volta)
- pnpm 9+
- Docker (for PostgreSQL)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/satellite-cx.git
   cd satellite-cx
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**

   ```bash
   pnpm db:up
   ```

5. **Run database migrations**

   ```bash
   pnpm db:reset
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

### Common Commands

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm db:reset` - Reset database with fresh schema

## 🤝 Contributing

We're excited about early contributors and feedback! Here's how you can get involved:

### Ways to Contribute

- 🐛 **Report Issues**: Found a bug or have a feature request? [Open an issue](https://github.com/your-org/satellite-cx/issues)
- 💻 **Code Contributions**: Pick up an issue or propose a feature
- 📖 **Documentation**: Help improve our docs and guides
- 💡 **Ideas & Feedback**: Share your thoughts on the project direction

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Make sure all tests pass before submitting PRs

### Current Priorities

We're currently focusing on:

1. Core ticket management workflows
2. User interface development
3. API stability and documentation
4. Database performance and scaling
5. Authentication and authorization

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🌟 Star History

If you find this project interesting, please consider giving it a star! It helps us gauge interest and motivates continued development.

---

**Note**: This project is under active development. APIs and features may change significantly. We recommend against using it in production environments until we reach a stable release.
