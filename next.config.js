/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: 'cdn.fortnite-api.com' },
      { protocol: 'https', hostname: 'cdn2.unrealengine.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
  },
};

// Sentry envuelve la config para poder subir "source maps" y mapear los
// errores minificados a tu código real. Si no hay SENTRY_DSN configurado,
// el envoltorio no hace nada perjudicial: el build sigue exactamente igual.
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;