const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fal.ai',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: '**.fal.media',
      },
    ],
  },
  // 廃止されたページから統合ページへのリダイレクト設定
  async redirects() {
    return [
      {
        source: '/text-to-image',
        destination: '/generate',
        permanent: true,
      },
      {
        source: '/text-to-video',
        destination: '/generate',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 