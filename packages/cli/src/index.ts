#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'
import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')

const program = new Command()

program
  .name('wolent')
  .description('Wolent CMS CLI — manage your CMS from the terminal')
  .version('0.1.0')

// ─── dev ──────────────────────────────────────────────────────────────────────
program
  .command('dev')
  .description('Start the CMS in development mode (backend + admin panel)')
  .action(() => {
    console.log(chalk.cyan('🚀 Starting Wolent CMS in dev mode...\n'))
    console.log(chalk.dim('  Backend : http://localhost:3000'))
    console.log(chalk.dim('  Admin   : http://localhost:1337\n'))
    const child = spawn('pnpm', ['dev'], { cwd: ROOT, stdio: 'inherit', shell: true })
    child.on('exit', (code) => process.exit(code ?? 0))
  })

// ─── build ────────────────────────────────────────────────────────────────────
program
  .command('build')
  .description('Build all packages for production')
  .action(() => {
    console.log(chalk.cyan('🔨 Building Wolent CMS...\n'))
    const spinner = ora('Building...').start()
    try {
      execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' })
      spinner.succeed(chalk.green('Build complete'))
    } catch (e: unknown) {
      spinner.fail(chalk.red('Build failed'))
      const err = e as { stdout?: Buffer; stderr?: Buffer }
      if (err.stdout) process.stdout.write(err.stdout)
      if (err.stderr) process.stderr.write(err.stderr)
      process.exit(1)
    }
  })

// ─── start ────────────────────────────────────────────────────────────────────
program
  .command('start')
  .description('Start the CMS in production mode')
  .action(() => {
    console.log(chalk.cyan('🚀 Starting Wolent CMS in production mode...\n'))
    const child = spawn('node', ['packages/core/dist/index.js'], { cwd: ROOT, stdio: 'inherit' })
    child.on('exit', (code) => process.exit(code ?? 0))
  })

// ─── db ───────────────────────────────────────────────────────────────────────
const db = program.command('db').description('Database management commands')

db.command('push')
  .description('Push Prisma schema to database (dev)')
  .action(() => {
    const spinner = ora('Pushing schema...').start()
    try {
      execSync('pnpm --filter @wolent/database db:push', { cwd: ROOT, stdio: 'pipe' })
      spinner.succeed(chalk.green('Schema pushed successfully'))
    } catch {
      spinner.fail(chalk.red('Schema push failed'))
      process.exit(1)
    }
  })

db.command('migrate')
  .description('Run pending database migrations')
  .action(() => {
    const spinner = ora('Running migrations...').start()
    try {
      execSync('pnpm --filter @wolent/database db:migrate', { cwd: ROOT, stdio: 'pipe' })
      spinner.succeed(chalk.green('Migrations complete'))
    } catch {
      spinner.fail(chalk.red('Migration failed'))
      process.exit(1)
    }
  })

db.command('studio')
  .description('Open Prisma Studio (database GUI)')
  .action(() => {
    console.log(chalk.cyan('Opening Prisma Studio...\n'))
    const child = spawn('pnpm', ['--filter', '@wolent/database', 'exec', 'prisma', 'studio'], {
      cwd: ROOT, stdio: 'inherit', shell: true,
    })
    child.on('exit', (code) => process.exit(code ?? 0))
  })

// ─── user ─────────────────────────────────────────────────────────────────────
const user = program.command('user').description('User management commands')

user.command('reset-password')
  .description('Reset a user password by email')
  .argument('<email>', 'User email address')
  .argument('<password>', 'New password (min 8 chars)')
  .action(async (email: string, password: string) => {
    const spinner = ora(`Resetting password for ${email}...`).start()
    try {
      const script = `
        import argon2 from 'argon2';
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        const hash = await argon2.hash('${password.replace(/'/g, "\\'")}');
        const result = await prisma.user.updateMany({ where: { email: '${email.replace(/'/g, "\\'")}' }, data: { passwordHash: hash } });
        console.log(result.count);
        await prisma.$disconnect();
      `
      const tmpFile = path.join(ROOT, '.wolent-reset-tmp.mjs')
      writeFileSync(tmpFile, script)

      const envPath = path.join(ROOT, '.env')
      const envArgs = existsSync(envPath) ? `--env-file=${envPath}` : ''

      const output = execSync(`node ${envArgs} ${tmpFile}`, { cwd: ROOT }).toString().trim()
      const { unlinkSync } = await import('node:fs')
      unlinkSync(tmpFile)

      if (output === '0') {
        spinner.fail(chalk.red(`No user found with email: ${email}`))
      } else {
        spinner.succeed(chalk.green(`Password reset for ${email}`))
      }
    } catch (e) {
      spinner.fail(chalk.red('Failed to reset password'))
      console.error(e)
      process.exit(1)
    }
  })

user.command('create')
  .description('Create a new admin user interactively')
  .action(async () => {
    const answers = await prompts([
      { type: 'text', name: 'firstName', message: 'First name' },
      { type: 'text', name: 'lastName', message: 'Last name' },
      { type: 'text', name: 'email', message: 'Email' },
      { type: 'password', name: 'password', message: 'Password (min 8 chars)' },
      {
        type: 'select', name: 'role', message: 'Role',
        choices: [
          { title: 'Super Admin', value: 'super_admin' },
          { title: 'Admin', value: 'admin' },
          { title: 'Editor', value: 'editor' },
          { title: 'Author', value: 'author' },
          { title: 'Viewer', value: 'viewer' },
        ],
      },
    ])

    if (!answers.email || !answers.password) {
      console.log(chalk.yellow('Cancelled.'))
      process.exit(0)
    }

    const spinner = ora('Creating user...').start()
    try {
      const script = `
        import argon2 from 'argon2';
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        const hash = await argon2.hash('${answers.password.replace(/'/g, "\\'")}');
        const user = await prisma.user.create({ data: {
          firstName: '${answers.firstName.replace(/'/g, "\\'")}',
          lastName: '${answers.lastName.replace(/'/g, "\\'")}',
          email: '${answers.email.replace(/'/g, "\\'")}',
          passwordHash: hash,
          role: '${answers.role}',
          tenantId: 'default',
        }});
        console.log(user.id);
        await prisma.$disconnect();
      `
      const tmpFile = path.join(ROOT, '.wolent-create-tmp.mjs')
      writeFileSync(tmpFile, script)
      const envPath = path.join(ROOT, '.env')
      const envArgs = existsSync(envPath) ? `--env-file=${envPath}` : ''
      const id = execSync(`node ${envArgs} ${tmpFile}`, { cwd: ROOT }).toString().trim()
      const { unlinkSync } = await import('node:fs')
      unlinkSync(tmpFile)
      spinner.succeed(chalk.green(`User created: ${answers.email} (id: ${id})`))
    } catch (e: unknown) {
      spinner.fail(chalk.red('Failed to create user'))
      const err = e as { message?: string }
      if (err.message?.includes('Unique constraint')) {
        console.error(chalk.red('  Email already exists.'))
      }
      process.exit(1)
    }
  })

// ─── keys ─────────────────────────────────────────────────────────────────────
program
  .command('generate-keys')
  .description('Generate JWT RS256 key pair and write to .env')
  .action(() => {
    const spinner = ora('Generating keys...').start()
    try {
      execSync('pnpm generate-keys', { cwd: ROOT, stdio: 'pipe' })
      spinner.succeed(chalk.green('Keys generated and written to .env'))
    } catch {
      spinner.fail(chalk.red('Key generation failed'))
      process.exit(1)
    }
  })

// ─── status ───────────────────────────────────────────────────────────────────
program
  .command('status')
  .description('Show CMS status (API health, DB connection)')
  .action(async () => {
    const spinner = ora('Checking status...').start()
    try {
      const res = await fetch('http://localhost:3000/health')
      const data = await res.json() as { status: string; version: string; timestamp: string }
      spinner.stop()
      console.log(chalk.green('✓') + ' API is running')
      console.log(chalk.dim(`  Version  : ${data.version}`))
      console.log(chalk.dim(`  Status   : ${data.status}`))
      console.log(chalk.dim(`  Time     : ${data.timestamp}`))
    } catch {
      spinner.fail(chalk.red('API is not running (start with: wolent dev)'))
    }
  })

// ─── logs ─────────────────────────────────────────────────────────────────────
program
  .command('logs')
  .description('Tail the core server logs')
  .action(() => {
    const logFile = path.join(ROOT, 'packages/core/logs/server.log')
    if (!existsSync(logFile)) {
      console.log(chalk.yellow('No log file found. Logs appear in terminal during dev mode.'))
      process.exit(0)
    }
    const child = spawn('tail', ['-f', logFile], { stdio: 'inherit' })
    child.on('exit', () => process.exit(0))
  })

program.parse()
