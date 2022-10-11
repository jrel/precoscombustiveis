/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}


const withPWA = require('next-pwa')({
})

module.exports = withPWA(nextConfig)

