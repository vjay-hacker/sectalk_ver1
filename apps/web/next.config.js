/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@sectalk/shared-types',
    '@sectalk/shared-ui',
    '@sectalk/security',
    '@sectalk/realtime',
    '@sectalk/ai-threat',
    '@sectalk/billing'
  ]
};

module.exports = nextConfig;
