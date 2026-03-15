/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'cloudinary.com', 'livepeercdn.studio'],
  },
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
  },
};

module.exports = nextConfig;
