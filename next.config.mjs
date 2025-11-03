/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io' }] },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io' }]
  },

};
export default nextConfig;
