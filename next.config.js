/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: 'cdn2.unrealengine.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
  },
};

module.exports = nextConfig;