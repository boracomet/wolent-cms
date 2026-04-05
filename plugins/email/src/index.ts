import nodemailer from 'nodemailer'
import type { WolentPlugin } from '@wolent/utils'

export interface EmailPluginConfig {
  provider: 'smtp' | 'resend'
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }
  resendApiKey?: string
  from?: string
}

export interface SendMailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

// Module-level transporter (initialized once on register)
let _transporter: nodemailer.Transporter | null = null
let _from = 'Wolent CMS <noreply@example.com>'

export async function sendMail(opts: SendMailOptions): Promise<void> {
  if (!_transporter) throw new Error('Email plugin not initialized')
  await _transporter.sendMail({
    from: opts.from ?? _from,
    to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
}

export const EmailPlugin = (config: EmailPluginConfig): WolentPlugin => ({
  meta: {
    name: '@wolent/plugin-email',
    version: '0.1.0',
    description: 'Email sending via SMTP or Resend',
    permissions: ['http.outbound', 'env.read'],
  },

  async register(_cms) {
    _from = config.from ?? _from

    if (config.provider === 'smtp' && config.smtp) {
      _transporter = nodemailer.createTransport(config.smtp)
      // Verify connection
      try {
        await _transporter.verify()
        console.log('✅ Email plugin: SMTP connection verified')
      } catch (err) {
        console.warn('⚠️ Email plugin: SMTP verification failed', err)
      }
    }
  },

  async destroy() {
    if (_transporter) {
      _transporter.close()
      _transporter = null
    }
  },
})

export default EmailPlugin
