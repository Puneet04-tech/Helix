/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_HOSPITAL_API: 'http://localhost:5001/api',
  },
}

module.exports = nextConfig
