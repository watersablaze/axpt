import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizeCss: true,
    serverActions: {},
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.axpt.io' },
      { protocol: 'https', hostname: 'axpt.io' },
    ],
  },

  webpack: (config, { isServer }) => {
    config.module.exprContextCritical = false;

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/env': path.resolve(__dirname, 'lib/env'),
      '@/auth': path.resolve(__dirname, 'lib/auth'),
      '@/utils': path.resolve(__dirname, 'lib/utils'),
      '@/components': path.resolve(__dirname, 'app/src/components'),
      '@/styles': path.resolve(__dirname, 'app/src/styles'),
      '@/types': path.resolve(__dirname, 'types'),
      '@/cli': path.resolve(__dirname, 'cli'),
      '@/scripts': path.resolve(__dirname, 'app/scripts'),
      '@/flows': path.resolve(__dirname, 'app/scripts/partner-tokens/utils/flows'),
      '@/lotties': path.resolve(__dirname, 'lib/lotties'),
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
    };

    if (!isServer) {
      config.output = {
        ...config.output,
        chunkFilename: 'static/chunks/[name].[contenthash].js',
      };
    }

    return config;
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;