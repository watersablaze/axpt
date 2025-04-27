import path from "path";
import type { Configuration } from "webpack"; // ✅ TypeScript typing for config

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Webpack configuration with correct typing
  webpack: (config: Configuration) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@": path.resolve(__dirname),
        "@/lib": path.resolve(__dirname, "lib"),
        "@/abi": path.resolve(__dirname, "abi"),
      },
      fallback: {
        ...config.resolve?.fallback,
        canvas: false, // ✅ Prevents issues with react-pdf dependencies
      },
    };
    return config;
  },

  // ✅ Image optimization settings
  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["yourdomain.com"], // Replace with your actual image domain(s)
  },

  experimental: {
    optimizeCss: true, // ✅ Modern CSS optimization
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // ✅ Clean production console logs
  },

  // ✅ Redirect logic
  async redirects() {
    return [
      {
        source: "/",            // Root route
        destination: "/landing", // Redirect to landing page
        permanent: true,        // SEO-friendly permanent redirect
      },
    ];
  },
};

export default nextConfig;