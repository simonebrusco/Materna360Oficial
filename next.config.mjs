/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.builder.io', pathname: '/**' }
    ],
    formats: ['image/avif', 'image/webp']
  }
};
export default nextConfig;
