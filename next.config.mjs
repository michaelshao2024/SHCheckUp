/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' is only needed for the Docker/SAE deployment path;
  // on Vercel it disables ISR, so enable it only when DOCKER_BUILD is set.
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
