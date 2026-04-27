/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shadowbroker/ui", "@shadowbroker/auth", "@shadowbroker/types"],
};

module.exports = nextConfig;
