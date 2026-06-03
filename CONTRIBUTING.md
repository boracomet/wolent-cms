# Contributing to Wolent CMS

Thank you for your interest in Wolent CMS. This project is open source and we welcome contributions from the community — whether you fix a bug, improve documentation, or propose a new feature.

## Code of Conduct

Be respectful and constructive. Focus on the technical merits of ideas and keep discussions welcoming for new contributors.

## How to Contribute

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/wolent-cms.git
cd wolent-cms
pnpm install
```

### 2. Create a branch

Use a descriptive branch name:

```bash
git checkout -b fix/media-upload-validation
git checkout -b feat/graphql-filtering
git checkout -b docs/setup-guide-clarity
```

Prefixes we use: `fix/`, `feat/`, `docs/`, `chore/`, `refactor/`, `test/`.

### 3. Make your changes

- Keep pull requests focused — one logical change per PR when possible.
- Update documentation if you change behavior, env vars, or API contracts.
- Add or update tests when fixing bugs or adding features.

### 4. Verify locally

```bash
pnpm typecheck   # TypeScript — required
pnpm test        # Vitest — required for logic changes
pnpm build       # Recommended before larger changes
```

For UI work:

```bash
pnpm dev
# Admin: http://localhost:1337  ·  API: http://localhost:3000
```

### 5. Open a Pull Request

Push your branch and open a PR against `main`. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Link related issues with `Fixes #123` or `Closes #123` when applicable.

A maintainer will review your PR. Address feedback with additional commits on the same branch.

## Code Style

### TypeScript

- Write all new code in **TypeScript** with strict typing.
- Prefer explicit types at module boundaries; avoid `any` unless unavoidable (document why).
- Match existing patterns in the package you touch (`packages/core`, `packages/admin`, etc.).
- Run `pnpm typecheck` before submitting — it must pass.

### Formatting and linting

- Follow the style of surrounding files (naming, imports, file layout).
- Use **Prettier** for formatting where applicable (`prettier` is available at the repo root).
- Respect inline `eslint-disable` comments only when necessary; do not disable rules broadly.
- If your editor supports ESLint with TypeScript rules, align with strict, unused-variable-free code.

### Commits

Write clear commit messages in English:

```
fix(core): reject invalid relation UID in content validator

feat(admin): add TR locale for media library empty state
```

### Monorepo conventions

```bash
# Add a dependency to core
pnpm --filter @wolent/core add <package>

# Add a dependency to admin
pnpm --filter @wolent/admin add <package>

# Database schema changes
pnpm --filter @wolent/database db:push
```

## Testing Requirements

- **Bug fixes** should include a test when the affected area already has Vitest coverage, or a clear manual test plan in the PR.
- **New features** should include unit/integration tests where the package uses Vitest (`packages/core`, etc.).
- Run `pnpm test` from the repository root before opening a PR.
- Do not commit secrets, `.env` files, or local database files.

## Reporting Issues

Use GitHub Issues with the appropriate template:

| Template | Use when |
| -------- | -------- |
| [Bug report](.github/ISSUE_TEMPLATE/bug_report.md) | Something is broken |
| [Feature request](.github/ISSUE_TEMPLATE/feature_request.md) | Proposing new functionality |

Include Wolent version, environment (OS, Node, database), steps to reproduce, and expected vs actual behavior.

## Documentation

- User-facing setup: `docs/SETUP.md`
- Release history: `CHANGELOG.md`
- Screenshots live in `docs/screenshots/` — update when the UI changes significantly.

## Questions?

Open a [GitHub Discussion](https://github.com/boracomet/wolent-cms/discussions) or an issue labeled `question` if discussions are enabled. For security vulnerabilities, please report privately to the maintainers rather than opening a public issue.

Thank you for helping make Wolent CMS better.
