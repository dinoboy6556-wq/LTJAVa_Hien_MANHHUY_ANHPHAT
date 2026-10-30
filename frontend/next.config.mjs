const backend = process.env.SPRING_API_URL || 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: backend + '/api/:path*' }];
  },
};

export default nextConfig;
