#!/usr/bin/env node
import { program } from 'commander'
import chalk from 'chalk'
import gradient from 'gradient-string'
import ora from 'ora'
import prompts from 'prompts'
import { execSync, spawn } from 'child_process'
import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.join(__dirname, '../templates')

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.log()
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('  ██╗    ██╗ ██████╗ ██╗     ███████╗███╗   ██╗████████╗'))
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('  ██║    ██║██╔═══██╗██║     ██╔════╝████╗  ██║╚══██╔══╝'))
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('  ██║ █╗ ██║██║   ██║██║     █████╗  ██╔██╗ ██║   ██║   '))
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('  ██║███╗██║██║   ██║██║     ██╔══╝  ██║╚██╗██║   ██║   '))
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('  ╚███╔███╔╝╚██████╔╝███████╗███████╗██║ ╚████║   ██║   '))
  console.log(gradient(['#a855f7', '#3b82f6', '#06b6d4'])('   ╚══╝╚══╝  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   '))
  console.log()
  console.log(chalk.gray('  Headless CMS — Faster than Strapi. Safer than everything else.'))
  console.log()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

function generateRsaKeyPair(): { privateKeyB64: string; publicKeyB64: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return {
    privateKeyB64: Buffer.from(privateKey).toString('base64'),
    publicKeyB64: Buffer.from(publicKey).toString('base64'),
  }
}

function runCommand(cmd: string, cwd: string): void {
  execSync(cmd, { stdio: 'inherit', cwd })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
program
  .name('create-wolent-app')
  .description('Create a new Wolent CMS project')
  .argument('[project-name]', 'Name of the project')
  .option('--use-npm', 'Use npm instead of pnpm')
  .option('--use-yarn', 'Use yarn instead of pnpm')
  .option('--skip-install', 'Skip dependency installation')
  .option('--db <provider>', 'Database provider: sqlite or postgres', 'sqlite')
  .option('--docker', 'Generate Docker Compose configuration')
  .action(async (projectNameArg: string | undefined, opts) => {
    printBanner()

    // ─── Project name ────────────────────────────────────────────────────────
    let projectName = projectNameArg
    if (!projectName) {
      const { name } = await prompts({
        type: 'text',
        name: 'name',
        message: 'Project name:',
        initial: 'my-wolent-app',
        validate: v => /^[a-z0-9-_]+$/.test(v) || 'Only lowercase letters, numbers, hyphens, underscores',
      })
      projectName = name as string
    }

    if (!projectName) {
      console.log(chalk.red('Aborted.'))
      process.exit(1)
    }

    // ─── Interactive setup ───────────────────────────────────────────────────
    const answers = await prompts([
      {
        type: 'select',
        name: 'db',
        message: 'Database:',
        choices: [
          { title: 'SQLite (development, zero setup)', value: 'sqlite' },
          { title: 'PostgreSQL (production)', value: 'postgres' },
        ],
        initial: opts.db === 'postgres' ? 1 : 0,
      },
      {
        type: 'toggle',
        name: 'docker',
        message: 'Generate Docker Compose?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'text',
        name: 'adminEmail',
        message: 'Admin email:',
        initial: 'admin@example.com',
        validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email',
      },
      {
        type: 'password',
        name: 'adminPassword',
        message: 'Admin password (min 8 chars, 1 uppercase, 1 number):',
        validate: (v: string) => {
          if (v.length < 8) return 'Min 8 characters'
          if (!/[A-Z]/.test(v)) return 'Must contain uppercase'
          if (!/[0-9]/.test(v)) return 'Must contain number'
          return true
        },
      },
    ])

    const targetDir = path.resolve(process.cwd(), projectName)

    if (await fs.pathExists(targetDir)) {
      console.log(chalk.red(`\nDirectory "${projectName}" already exists. Please choose a different name.\n`))
      process.exit(1)
    }

    const spinner = ora('Creating project...').start()

    // ─── Copy template ───────────────────────────────────────────────────────
    await fs.copy(path.join(TEMPLATES_DIR, 'base'), targetDir)

    // ─── Generate .env ────────────────────────────────────────────────────────
    const { privateKeyB64: jwtPrivateKey, publicKeyB64: jwtPublicKey } = generateRsaKeyPair()
    const cookieSecret = generateSecret(32)
    const adminJwtSecret = generateSecret(32)

    const dbUrl = answers['db'] === 'postgres'
      ? `postgresql://wolent:wolent@localhost:5432/wolent_${projectName.replace(/-/g, '_')}?schema=public`
      : `file:./dev.db`

    const envContent = [
      `# Wolent CMS — Environment Configuration`,
      `# Generated by create-wolent-app`,
      ``,
      `NODE_ENV=development`,
      `PORT=3000`,
      `HOST=0.0.0.0`,
      ``,
      `# Database`,
      `DATABASE_URL="${dbUrl}"`,
      ``,
      `# JWT (RS256) — Replace with real RSA keys in production!`,
      `# Generate with: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem`,
      `# Then base64 encode: base64 -i private.pem`,
      `JWT_PRIVATE_KEY="${Buffer.from(jwtPrivateKey).toString('base64')}"`,
      `JWT_PUBLIC_KEY="${Buffer.from(jwtPublicKey).toString('base64')}"`,
      `JWT_ACCESS_EXPIRES=15m`,
      `JWT_REFRESH_EXPIRES=7d`,
      ``,
      `# Secrets`,
      `COOKIE_SECRET="${cookieSecret}"`,
      `ADMIN_JWT_SECRET="${adminJwtSecret}"`,
      ``,
      `# CORS (comma-separated origins)`,
      `CORS_ORIGINS=http://localhost:1337`,
      ``,
      `# Rate Limiting`,
      `RATE_LIMIT_MAX=100`,
      `RATE_LIMIT_WINDOW=1 minute`,
      ``,
      `# Media`,
      `UPLOAD_PROVIDER=local`,
      `UPLOAD_DIR=./public/uploads`,
      `MAX_UPLOAD_SIZE=10485760`,
      ``,
      `# Admin credentials (used on first run)`,
      `WOLENT_ADMIN_EMAIL="${answers['adminEmail']}"`,
      `WOLENT_ADMIN_PASSWORD="${answers['adminPassword']}"`,
      ``,
      `SETUP_COMPLETED=false`,
    ].join('\n')

    await fs.writeFile(path.join(targetDir, '.env'), envContent)
    await fs.writeFile(path.join(targetDir, '.env.example'), envContent.replace(/=".+"/g, '=""'))

    // ─── Update package.json name ────────────────────────────────────────────
    const pkgPath = path.join(targetDir, 'package.json')
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath) as Record<string, unknown>
      pkg['name'] = projectName
      await fs.writeJson(pkgPath, pkg, { spaces: 2 })
    }

    // ─── Docker Compose ───────────────────────────────────────────────────────
    if (answers['docker']) {
      const dockerCompose = generateDockerCompose(projectName, answers['db'] as string)
      await fs.writeFile(path.join(targetDir, 'docker-compose.yml'), dockerCompose)
      await fs.writeFile(path.join(targetDir, 'Dockerfile'), generateDockerfile())
    }

    spinner.succeed('Project created!')

    // ─── Install dependencies ─────────────────────────────────────────────────
    if (!opts.skipInstall) {
      const pm = opts.useNpm ? 'npm' : opts.useYarn ? 'yarn' : 'npm'
      const installSpinner = ora(`Installing dependencies with ${pm}...`).start()
      try {
        runCommand(`${pm} install`, targetDir)
        installSpinner.succeed('Dependencies installed!')
      } catch {
        installSpinner.fail('Failed to install dependencies. Run npm install manually.')
      }
    }

    // ─── Auto DB setup ────────────────────────────────────────────────────────
    if (!opts.skipInstall) {
      const dbSpinner = ora('Setting up database...').start()
      try {
        if (answers['db'] === 'sqlite') {
          runCommand('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', targetDir)
        } else {
          runCommand('npx prisma migrate deploy --schema=./prisma/schema.prisma', targetDir)
        }
        dbSpinner.succeed('Database ready!')
      } catch {
        dbSpinner.warn('Database setup failed — run manually: ' + (answers['db'] === 'sqlite' ? 'npm run db:push' : 'npm run db:migrate'))
      }
    }

    // ─── Done ─────────────────────────────────────────────────────────────────
    console.log()
    console.log(chalk.green('✅ Wolent CMS project created successfully!'))
    console.log()
    console.log(chalk.bold('Next steps:'))
    console.log()
    console.log(`  ${chalk.cyan('cd')} ${projectName}`)
    console.log(`  ${chalk.cyan('npm run develop')}        ${chalk.gray('# Start development server')}`)
    console.log()
    console.log(`  Admin panel: ${chalk.bold.cyan('http://localhost:1337')}`)
    console.log(`  API:         ${chalk.bold.cyan('http://localhost:3000')}`)
    console.log()

    if (answers['docker']) {
      console.log(chalk.bold('Or with Docker:'))
      console.log()
      console.log(`  ${chalk.cyan('docker-compose up')}`)
      console.log()
    }

    console.log(chalk.gray('  Happy building! 🚀'))
    console.log()
  })

program.parse()

// ─── Template generators ──────────────────────────────────────────────────────
function generateDockerCompose(projectName: string, db: string): string {
  const dbName = projectName.replace(/-/g, '_')

  if (db === 'postgres') {
    return `version: '3.9'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://wolent:\${POSTGRES_PASSWORD:-wolent_secret}@postgres:5432/${dbName}
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads:/app/public/uploads
    restart: unless-stopped
    networks:
      - wolent

  admin:
    image: nginx:alpine
    ports:
      - "1337:80"
    volumes:
      - ./admin-dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
    networks:
      - wolent

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: wolent
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-wolent_secret}
      POSTGRES_DB: ${dbName}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wolent"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - wolent

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - wolent

volumes:
  postgres_data:
  redis_data:
  uploads:

networks:
  wolent:
    driver: bridge
`
  }

  return `version: '3.9'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./dev.db:/app/dev.db
      - uploads:/app/public/uploads
    restart: unless-stopped

  admin:
    image: nginx:alpine
    ports:
      - "1337:80"
    volumes:
      - ./admin-dist:/usr/share/nginx/html:ro

volumes:
  uploads:
`
}

function generateDockerfile(): string {
  return `FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
`
}
