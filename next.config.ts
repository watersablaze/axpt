// next.config.ts
import path from 'path';
import { NextConfig } from 'next';

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
      {
        protocol: 'https',
        hostname: '**.axpt.io',
      },
      {
        protocol: 'https',
        hostname: 'axpt.io',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    config.module.exprContextCritical = false;

    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        '@': path.resolve(__dirname, 'app/src'),
        '@/components': path.resolve(__dirname, 'app/src/components'),
        '@/lib': path.resolve(__dirname, 'app/src/lib'),
        '@/lotties': path.resolve(__dirname, 'app/src/lotties'),
      },
      fallback: {
        ...(config.resolve?.fallback || {}),
        canvas: false,
      },
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