import type { NextConfig } from 'next';

// TEE nodes on devnet use self-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['server-only'],
};

export default nextConfig;
