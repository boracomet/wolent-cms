# Wolent CMS — Setup Guide

This guide walks through installing and running Wolent CMS for development and production. Screenshots referenced below live in [`docs/screenshots/`](screenshots/).

## Prerequisites

| Requirement | Version |
| ----------- | ------- |
| Node.js     | 20+     |
| pnpm        | 9+      |
| Git         | any recent |

Optional:

- **Docker** and **Docker Compose** for containerized runs
- **PostgreSQL 16+** for production databases
- **Redis 7+** for caching and rate limiting (via plugin profile)

## Installation Paths

Choose one:

1. [Docker Compose](#docker-compose) — fastest way to run API + admin
2. [Manual monorepo setup](#manual-setup) — for core contributors and customization
3. [create-wolent-app](#create-wolent-app-scaffold) — greenfield project scaffold

---

## Docker Compose

### 1. Clone and configure

```bash
git clone https://github.com/boracomet/wolent-cms.git
cd wolent-cms
cp .env.example .env
```

Generate JWT keys on the host (writes into `.env`):

```bash
pnpm install
pnpm generate-keys
```

Set strong values for at least:

- `COOKIE_SECRET` (32+ characters)
- `ADMIN_JWT_SECRET` (32+ characters)
- `WOLENT_ADMIN_PASSWORD`

### 2. Start services

```bash
docker compose up
```

| Service | URL |
| ------- | --- |
| Admin panel | http://localhost:1337 |
| REST API | http://localhost:3000 |
| Health | http://localhost:3000/health |

### 3. Optional profiles

**PostgreSQL** (production-style database):

```bash
# Set DATABASE_URL in .env, e.g.:
# DATABASE_URL=postgresql://wolent:wolent@postgres:5432/wolent_cms?schema=public

docker compose --profile postgres up
```

**Redis**:

```bash
docker compose --profile redis up
```

Volumes persist uploads (`uploads`), SQLite data (`db_data`), and optional Postgres/Redis data.

---

## Manual Setup

### 1. Install dependencies

```bash
git clone https://github.com/boracomet/wolent-cms.git
cd wolent-cms
pnpm install
```

### 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` — key variables:

```env
DATABASE_URL="file:./dev.db"
JWT_PRIVATE_KEY=""          # filled by generate-keys
JWT_PUBLIC_KEY=""
COOKIE_SECRET="your-32-char-minimum-secret"
ADMIN_JWT_SECRET="your-32-char-minimum-secret"
CORS_ORIGINS=http://localhost:1337
WOLENT_ADMIN_EMAIL=admin@example.com
WOLENT_ADMIN_PASSWORD=YourSecurePassword!
UPLOAD_PROVIDER=local
UPLOAD_DIR=./public/uploads
```

### 3. Keys and database

```bash
pnpm generate-keys
pnpm setup
```

`pnpm setup` runs key generation (if needed), `db:push`, and initial admin bootstrap.

Alternatively, step by step:

```bash
pnpm --filter @wolent/database db:push
pnpm --filter @wolent/core setup
```

### 4. Development servers

```bash
pnpm dev
```

| Service | URL |
| ------- | --- |
| Admin (Vite) | http://localhost:1337 |
| API | http://localhost:3000 |

### 5. Production build

```bash
pnpm build
pnpm --filter @wolent/core start
```

In production, the admin static assets are served from `packages/admin/dist` by the API process on `PORT` (default `3000`).

---

## create-wolent-app Scaffold

For a new site repository (not the monorepo itself):

```bash
npx create-wolent-app my-site
cd my-site
npm run db:push
npm run develop
```

The wizard prompts for database type, Docker Compose generation, and initial admin credentials.

---

## First Login & Admin Tour

After the stack is running, open the admin panel and sign in with `WOLENT_ADMIN_EMAIL` / `WOLENT_ADMIN_PASSWORD`.

### Dashboard

![Wolent CMS Dashboard](screenshots/01-dashboard.png)

The dashboard summarizes content activity and quick actions.

### Content type wizard (Step 1 — Name)

![Content type wizard — name step](screenshots/02-wizard-step1-name.png)

Create a new type via the **3-step wizard**: name and API identifier first.

### Content types list

![Content types list](screenshots/03-content-types-list.png)

Manage all content types, including presets (Blog, Product, Portfolio).

### Field builder

![Post fields — visual builder](screenshots/04-post-fields.png)

Add fields, relations (with dropdown picker), and components in the visual builder.

---

## Database

### SQLite (development)

Default in `.env.example`:

```env
DATABASE_URL="file:./dev.db"
```

Apply schema changes:

```bash
pnpm --filter @wolent/database db:push
```

### PostgreSQL (production)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wolent_cms?schema=public"
```

```bash
pnpm --filter @wolent/database db:migrate
```

### Prisma Studio

```bash
pnpm --filter @wolent/database db:studio
```

---

## API Overview

Base URL: `http://localhost:3000` (or your deployment host).

### Authentication

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourSecurePassword!"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>`. Include tenant header when required:

```http
X-Wolent-Tenant: default
```

### Content CRUD

Replace `{uid}` with your content type UID (e.g. `api::article.article`).

| Method | Path | Body |
| ------ | ---- | ---- |
| `GET` | `/api/{uid}` | — |
| `GET` | `/api/{uid}/{id}` | — |
| `POST` | `/api/{uid}` | `{ "data": { ... } }` |
| `PUT` | `/api/{uid}/{id}` | `{ "data": { ... } }` |
| `POST` | `/api/{uid}/{id}/publish` | — |
| `POST` | `/api/{uid}/{id}/unpublish` | — |
| `DELETE` | `/api/{uid}/{id}` | — |

### Admin & media

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/admin/content-types` | List content types |
| `POST` | `/api/admin/content-types` | Create content type |
| `GET` | `/api/admin/users` | List users |
| `POST` | `/api/upload` | Upload file |
| `GET` | `/api/upload/files` | List media |
| `GET` | `/api/admin/api-tokens` | API tokens |
| `GET` | `/api/admin/plugins` | Plugin status |
| `GET` | `/health` | Health check |

---

## Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | API listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_URL` | — | Prisma connection string |
| `JWT_PRIVATE_KEY` | — | RSA private key (base64) |
| `JWT_PUBLIC_KEY` | — | RSA public key (base64) |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token TTL |
| `COOKIE_SECRET` | — | Cookie signing secret |
| `CORS_ORIGINS` | — | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | `100` | Requests per window |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate limit window |
| `UPLOAD_PROVIDER` | `local` | `local` or `s3` |
| `UPLOAD_DIR` | `./public/uploads` | Local upload path |
| `MAX_UPLOAD_SIZE` | `10485760` | Max upload bytes |
| `WOLENT_ADMIN_EMAIL` | — | Bootstrap admin email |
| `WOLENT_ADMIN_PASSWORD` | — | Bootstrap admin password |

See [`.env.example`](../.env.example) for S3, Redis, and PostgreSQL Docker variables.

---

## Plugins

Enable and configure plugins from **Admin → Plugins**:

| Plugin | Purpose |
| ------ | ------- |
| S3 Object Storage | AWS S3 or compatible storage |
| SMTP Mail | Transactional email |
| Redis Cache | Response caching |
| Gemini AI Translate | AI-assisted translation |
| Native Analytics | Privacy-friendly page views |
| Sitemap XML | Auto `/sitemap.xml` |
| Robots.txt | Crawler rules |
| N8N Automation | Workflow webhooks |
| Outbound Webhook | Content event hooks |
| Image Optimization | Compress on upload |
| Cookie Management | GDPR-style consent banner |

---

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| 401 on API | Token expired — refresh or re-login |
| Admin blank | API running? CORS_ORIGINS includes admin URL? |
| DB errors | `DATABASE_URL` correct? Run `db:push` or `db:migrate` |
| Upload fails | `UPLOAD_DIR` writable, `MAX_UPLOAD_SIZE` sufficient |
| JWT errors | Run `pnpm generate-keys`, restart API |

---

## Next Steps

- [README](../README.md) — overview and quick links  
- [CONTRIBUTING.md](../CONTRIBUTING.md) — contribution workflow  
- [CHANGELOG.md](../CHANGELOG.md) — release notes  
