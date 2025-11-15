/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Do not fail the build on ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
