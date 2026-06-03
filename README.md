<p align="center">
  <img src="docs/logo-placeholder.svg" alt="Wolent CMS" width="120" height="120" />
</p>

<h1 align="center">Wolent CMS</h1>

<p align="center">
  <strong>Open-source headless CMS built with TypeScript, Fastify, and Prisma</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-1.0.0-green.svg" alt="Version 1.0.0" /></a>
  <a href="https://github.com/boracomet/wolent-cms/actions"><img src="https://img.shields.io/github/actions/workflow/status/boracomet/wolent-cms/ci.yml?branch=main&label=build" alt="Build Status" /></a>
  <a href="https://github.com/boracomet/wolent-cms"><img src="https://img.shields.io/github/stars/boracomet/wolent-cms?style=social" alt="GitHub Stars" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#api-reference">API</a> •
  <a href="docs/SETUP.md">Setup Guide</a> •
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

Wolent CMS is a self-hosted, developer-first headless content management system. Model content visually, expose it through a secure REST API, and manage media, users, and plugins from a modern admin panel.

## Features

- 🧩 **Visual Content Builder** — Drag-and-drop fields, components, and dynamic zones
- 🔗 **Relation Fields** — Dropdown picker for linking content types
- 🌍 **Multi-language** — Admin panel in Turkish and English (extensible)
- 📋 **Preset Templates** — Blog, Product, and Portfolio starters out of the box
- 🪄 **3-Step Wizard** — Guided content type creation flow
- 🔌 **REST API** — JWT RS256 authentication, RBAC, and API tokens
- 🖼️ **Media Library** — Folders, bulk upload, local or S3 storage
- 📜 **Audit Logs** — Track admin and content changes
- 🧰 **Plugin System** — S3, SMTP, Redis, webhooks, analytics, and more
- 🐳 **Docker Ready** — SQLite for development, PostgreSQL for production
- ⚡ **Fast Stack** — Fastify 5, React 18, Prisma, argon2id password hashing

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/boracomet/wolent-cms.git
cd wolent-cms
cp .env.example .env
# Edit .env — set JWT keys (pnpm generate-keys) and secrets

docker compose up
```

| Service      | URL                      |
| ------------ | ------------------------ |
| Admin Panel  | http://localhost:1337    |
| REST API     | http://localhost:3000    |
| Health Check | http://localhost:3000/health |

Optional profiles:

```bash
# PostgreSQL
docker compose --profile postgres up

# Redis
docker compose --profile redis up
```

### Option B — Manual setup

**Requirements:** Node.js 20+, pnpm 9+

```bash
git clone https://github.com/boracomet/wolent-cms.git
cd wolent-cms
pnpm install
cp .env.example .env
pnpm generate-keys
pnpm setup
pnpm dev
```

- Admin Panel: http://localhost:1337  
- API: http://localhost:3000  

For environment variables, database migrations, and production builds, see the **[Setup Guide](docs/SETUP.md)**.

### Option C — Scaffold a new project

```bash
npx create-wolent-app my-site
cd my-site
npm run db:push
npm run develop
```

## Screenshots

| Dashboard | Content Type Wizard |
| --- | --- |
| ![Dashboard](docs/screenshots/01-dashboard.png) | ![Wizard](docs/screenshots/02-wizard-step1-name.png) |

| Content Types | Field Builder |
| --- | --- |
| ![Content Types](docs/screenshots/03-content-types-list.png) | ![Fields](docs/screenshots/04-post-fields.png) |

More screenshots and setup walkthrough: **[docs/SETUP.md](docs/SETUP.md)** · **[docs/screenshots/](docs/screenshots/)**

## Project Structure

```
wolent-cms/
├── packages/
│   ├── core/           # Fastify API — auth, content engine, plugins
│   ├── admin/          # React + Vite admin panel
│   ├── database/       # Prisma schema and client
│   ├── utils/          # Shared utilities
│   └── create-wolent-app/  # Project scaffolding CLI
├── docs/
│   ├── SETUP.md
│   └── screenshots/
├── docker-compose.yml
└── .env.example
```

## API Reference

Authenticate and call content endpoints:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# List entries (replace {uid} with your content type UID)
curl http://localhost:3000/api/{uid} \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Wolent-Tenant: default"
```

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Refresh tokens |
| `GET` | `/api/{uid}` | List entries |
| `GET` | `/api/{uid}/{id}` | Get entry |
| `POST` | `/api/{uid}` | Create entry |
| `PUT` | `/api/{uid}/{id}` | Update entry |
| `POST` | `/api/{uid}/{id}/publish` | Publish entry |
| `DELETE` | `/api/{uid}/{id}` | Delete entry |
| `GET` | `/api/admin/content-types` | List content types |
| `POST` | `/api/upload` | Upload media |
| `GET` | `/health` | Health check |

Full endpoint list, plugins, and environment variables are documented in **[docs/SETUP.md](docs/SETUP.md#api-overview)** and the README sections above.

## Development

```bash
pnpm dev          # Start API + admin in development
pnpm build        # Production build (all packages)
pnpm test         # Run Vitest across the monorepo
pnpm typecheck    # TypeScript check all packages
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for branch workflow, code style, and pull request guidelines.

## Contributing

We welcome issues, documentation improvements, and pull requests. Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR.

## Changelog

Release notes are in **[CHANGELOG.md](CHANGELOG.md)**.

## License

[MIT License](LICENSE) — Copyright © Wolent
