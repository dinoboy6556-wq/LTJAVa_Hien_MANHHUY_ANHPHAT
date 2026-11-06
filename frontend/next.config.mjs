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
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'same-origin'}]}];},
  async redirects(){return [
    ...Object.entries({'/user':'/','/user/borrowed':'/account/loans','/user/history':'/account/history','/user/profile':'/account/profile','/user/favorites':'/account/favorites','/user/cart':'/cart','/user/library':'/library','/user/login':'/login','/user/register':'/register'}).map(([source,destination])=>({source,destination,permanent:false})),
    {source:'/user/books/:path*',destination:'/books/:path*',permanent:false},
    {source:'/user/read/:slug',destination:'/read/:slug',permanent:false},
  ];},
  async rewrites() {
    return [
      { source: '/api/:path*', destination: backend + '/api/:path*' },
      { source: '/admin', destination: backend + '/admin' },
      { source: '/admin/:path*', destination: backend + '/admin/:path*' },
      { source: '/images/:path*', destination: backend + '/images/:path*' },
      { source: '/css/:path*', destination: backend + '/css/:path*' },
      { source: '/js/:path*', destination: backend + '/js/:path*' },
    ];
  },
};

export default nextConfig;
