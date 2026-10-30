import os from 'node:os';

const backend = process.env.SPRING_API_URL || 'http://localhost:8080';
const privateAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((address) => address && (address.family === 'IPv4' || address.family === 4) && !address.internal)
  .map(({ address }) => address)
  .filter((address) => {
    const [first, second] = address.split('.').map(Number);
    return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev assets and HMR when opening the app via this machine's LAN IP.
  allowedDevOrigins: [...new Set(privateAddresses)],
  async rewrites() {
    return [{ source: '/api/:path*', destination: backend + '/api/:path*' }];
  },
};

export default nextConfig;
