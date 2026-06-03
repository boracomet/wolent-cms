# Changelog

All notable changes to Wolent CMS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-03

### Added

- **Initial release** of Wolent CMS as an open-source headless CMS
- **Content types with visual builder** — drag-and-drop field layout, components, and dynamic zones
- **Relation fields with dropdown picker** — link entries across content types from the admin UI
- **Multi-language support (TR/EN)** — localized admin panel strings
- **Preset templates** — Blog, Product, and Portfolio content type starters
- **3-step wizard** for content type creation (name → fields → review)
- **REST API with authentication** — JWT RS256 access/refresh tokens, RBAC, and API tokens
- **Media library** — upload, folders, local storage with optional S3 plugin
- **Audit logs** — track administrative and content operations
- **Plugin system** — extensible plugins (S3, SMTP, Redis, webhooks, analytics, sitemap, and more)
- Docker Compose setup for API, admin, and optional PostgreSQL/Redis profiles
- Monorepo packages: `@wolent/core`, `@wolent/admin`, `@wolent/database`, `@wolent/utils`, `create-wolent-app`

[1.0.0]: https://github.com/boracomet/wolent-cms/releases/tag/v1.0.0
