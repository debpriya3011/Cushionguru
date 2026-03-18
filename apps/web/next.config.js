const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip/brotli compression for all responses
  compress: true,

  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cushion-saas-images.s3.eu-north-1.amazonaws.com',
      },
    ],
    // Optimize image format conversion
    formats: ['image/webp', 'image/avif'],
  },

  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // Tree-shake lucide-react imports so only used icons are bundled
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Add performance + security headers to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets (JS, CSS, fonts, images) aggressively
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Rewrites removed as they proxy internal API calls to a non-existent server
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
